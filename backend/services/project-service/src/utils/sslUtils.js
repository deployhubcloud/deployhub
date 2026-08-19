import fs from 'fs';
import path from 'path';
import { AppError } from '../../../../shared/errors/AppError.js';
import { checkAndPullImage } from '../../../../shared/docker/checkAndPullImage.js';
import { docker } from './docker.js';
import { SslCertificate } from '../models/sslCertificate.js';
import { project_env } from '../lib/env.js';

const ACME_WEBROOT = '/var/www/html';

function isProduction() {
    return project_env.NODE_ENV === 'production';
}

export function letsencryptHostDir() {
    if (process.env.LETSENCRYPT_HOST_DIR) return process.env.LETSENCRYPT_HOST_DIR;
    if (isProduction()) return '/home/rahul/docker/letsencrypt';
    return path.join(process.cwd(), 'letsencrypt');
}

export function nginxHtmlHostDir() {
    if (process.env.NGINX_HTML_HOST_DIR) return process.env.NGINX_HTML_HOST_DIR;
    if (isProduction()) return '/home/rahul/docker/nginx/html';
    return path.join(process.cwd(), 'nginx/html');
}

function certHostPath(domain) {
    return path.join(letsencryptHostDir(), 'live', domain, 'fullchain.pem');
}

function certExists(domain) {
    try {
        return fs.existsSync(certHostPath(domain));
    } catch {
        return false;
    }
}

function buildDates(from = new Date()) {
    const issuedAt = new Date(from);
    const expiresAt = new Date(issuedAt);
    expiresAt.setDate(expiresAt.getDate() + 90);
    const nextRenewAt = new Date(expiresAt);
    nextRenewAt.setDate(nextRenewAt.getDate() - 30);
    return {
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        nextRenewAt,
    };
}

function summarizeCertbotLogs(logs = '') {
    const text = String(logs || '');
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    const important = lines.filter((l) =>
        /error|failed|unauthorized|timeout|connection|detail|challenge|invalid|nxdomain|dns/i.test(l)
    );
    const pick = (important.length ? important : lines).slice(-8).join(' | ');
    return pick.slice(0, 700) || 'no certbot logs';
}

async function runCertbot(cmd, networkMode) {
    await checkAndPullImage(docker, 'certbot/certbot');

    const letsencryptBind = `${letsencryptHostDir()}:/etc/letsencrypt`;
    const htmlBind = `${nginxHtmlHostDir()}:${ACME_WEBROOT}`;

    if (!fs.existsSync(letsencryptHostDir())) {
        fs.mkdirSync(letsencryptHostDir(), { recursive: true });
    }
    if (!fs.existsSync(nginxHtmlHostDir())) {
        fs.mkdirSync(nginxHtmlHostDir(), { recursive: true });
    }
    fs.mkdirSync(path.join(nginxHtmlHostDir(), '.well-known', 'acme-challenge'), { recursive: true });

    const container = await docker.createContainer({
        Image: 'certbot/certbot',
        Cmd: cmd,
        HostConfig: {
            Binds: [letsencryptBind, htmlBind],
            AutoRemove: false,
            NetworkMode: networkMode || process.env.DOCKER_PROXY_NETWORK || 'proxy-net',
        },
    });

    try {
        await container.start();
        const result = await container.wait();
        let logs = '';
        try {
            const buf = await container.logs({ stdout: true, stderr: true, timestamps: false });
            logs = Buffer.isBuffer(buf) ? buf.toString('utf8') : String(buf || '');
            logs = logs.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
        } catch {
            logs = '';
        }

        if (result.StatusCode !== 0) {
            console.error(`[ssl] certbot failed exit=${result.StatusCode}\n${logs}`);
            throw new AppError(
                `SSL certificate request failed (certbot exit ${result.StatusCode}). ${summarizeCertbotLogs(logs)}`,
                502
            );
        }
        return true;
    } finally {
        try {
            await container.remove({ force: true });
        } catch {
        }
    }
}

export async function issueOrReuseCertificate({
    domain,
    userId,
    projectId,
    email,
    networkMode,
}) {
    const existingDb = await SslCertificate.findOne({ domain }).lean();
    const onDisk = certExists(domain);

    if (onDisk && existingDb?.status !== 'failed') {
        const dates = existingDb?.expiresAt
            ? {
                issuedAt: existingDb.issuedAt,
                expiresAt: existingDb.expiresAt,
                nextRenewAt: existingDb.nextRenewAt || buildDates().nextRenewAt,
            }
            : buildDates();

        const doc = await SslCertificate.findOneAndUpdate(
            { domain },
            {
                $set: {
                    userId,
                    projectId,
                    domain,
                    ...dates,
                    lastRenewAttempt: new Date(),
                    status: 'active',
                    lastError: null,
                },
            },
            { upsert: true, new: true }
        );

        return {
            reused: true,
            issuedAt: doc.issuedAt,
            expiresAt: doc.expiresAt,
            nextRenewAt: doc.nextRenewAt,
        };
    }

    if (!isProduction() && process.env.SKIP_CERTBOT === 'true') {
        const dates = buildDates();
        const doc = await SslCertificate.findOneAndUpdate(
            { domain },
            {
                $set: {
                    userId,
                    projectId,
                    domain,
                    ...dates,
                    lastRenewAttempt: new Date(),
                    status: 'active',
                    lastError: null,
                },
            },
            { upsert: true, new: true }
        );
        return {
            reused: false,
            issuedAt: doc.issuedAt,
            expiresAt: doc.expiresAt,
            nextRenewAt: doc.nextRenewAt,
        };
    }

    if (!email) {
        throw new AppError('CERTBOT_EMAIL is required to issue certificates', 500);
    }

    await runCertbot(
        [
            'certonly',
            '--webroot',
            '--webroot-path',
            ACME_WEBROOT,
            '--non-interactive',
            '--agree-tos',
            '--no-eff-email',
            '--email',
            email,
            '--cert-name',
            domain,
            '-d',
            domain,
            '--keep-until-expiring',
        ],
        networkMode
    );

    if (!certExists(domain)) {
        throw new AppError(
            'Certbot finished but certificate files were not found on disk. Check LETSENCRYPT_HOST_DIR mount.',
            502
        );
    }

    const dates = buildDates();
    const doc = await SslCertificate.findOneAndUpdate(
        { domain },
        {
            $set: {
                userId,
                projectId,
                domain,
                ...dates,
                lastRenewAttempt: new Date(),
                status: 'active',
                lastError: null,
            },
        },
        { upsert: true, new: true }
    );

    return {
        reused: false,
        issuedAt: doc.issuedAt,
        expiresAt: doc.expiresAt,
        nextRenewAt: doc.nextRenewAt,
    };
}

export async function renewCertificate({ domain, projectId, email, networkMode }) {
    try {
        if (!isProduction() && process.env.SKIP_CERTBOT === 'true') {
            const dates = buildDates();
            const doc = await SslCertificate.findOneAndUpdate(
                { domain, ...(projectId ? { projectId } : {}) },
                {
                    $set: {
                        ...dates,
                        lastRenewAttempt: new Date(),
                        status: 'active',
                        lastError: null,
                    },
                },
                { new: true }
            );
            return {
                domain,
                expiresAt: doc?.expiresAt || dates.expiresAt,
                nextRenewAt: doc?.nextRenewAt || dates.nextRenewAt,
            };
        }

        await runCertbot(
            [
                'certonly',
                '--webroot',
                '--webroot-path',
                ACME_WEBROOT,
                '--non-interactive',
                '--agree-tos',
                '--no-eff-email',
                '--email',
                email || process.env.CERTBOT_EMAIL,
                '--cert-name',
                domain,
                '-d',
                domain,
                '--force-renewal',
            ],
            networkMode
        );

        const dates = buildDates();
        const doc = await SslCertificate.findOneAndUpdate(
            { domain, ...(projectId ? { projectId } : {}) },
            {
                $set: {
                    ...dates,
                    lastRenewAttempt: new Date(),
                    status: 'active',
                    lastError: null,
                },
            },
            { new: true }
        );

        console.log(`[ssl] Certificate renewed for ${domain}`);
        return {
            domain,
            expiresAt: doc?.expiresAt || dates.expiresAt,
            nextRenewAt: doc?.nextRenewAt || dates.nextRenewAt,
        };
    } catch (error) {
        await SslCertificate.findOneAndUpdate(
            { domain },
            {
                $set: {
                    lastRenewAttempt: new Date(),
                    status: 'failed',
                    lastError: error.message || 'renew failed',
                },
            }
        );
        throw error;
    }
}

export async function renewDueCertificates() {
    const now = new Date();
    const due = await SslCertificate.find({
        status: { $in: ['active', 'failed'] },
        $or: [
            { nextRenewAt: { $lte: now } },
            {
                expiresAt: {
                    $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                },
            },
        ],
    }).limit(50);

    const results = [];
    for (const cert of due) {
        try {
            const renewed = await renewCertificate({
                domain: cert.domain,
                projectId: cert.projectId,
                email: process.env.CERTBOT_EMAIL,
            });
            results.push({ domain: cert.domain, ok: true, ...renewed });
        } catch (error) {
            console.error(`[ssl-renew] failed for ${cert.domain}:`, error.message);
            results.push({ domain: cert.domain, ok: false, message: error.message });
        }
    }
    return results;
}
