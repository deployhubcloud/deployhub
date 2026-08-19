import fs from 'fs';
import path from 'path';
import { AppError } from '../../../../shared/errors/AppError.js';
import { checkAndPullImage } from '../../../../shared/docker/checkAndPullImage.js';
import { docker } from './docker.js';
import { SslCertificate } from '../models/sslCertificate.js';
import { project_env } from '../lib/env.js';

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

async function runCertbot(cmd, networkMode) {
    await checkAndPullImage(docker, 'certbot/certbot');

    const letsencryptBind = `${letsencryptHostDir()}:/etc/letsencrypt`;
    const htmlBind = `${nginxHtmlHostDir()}:/var/www/html`;

    if (!fs.existsSync(letsencryptHostDir())) {
        fs.mkdirSync(letsencryptHostDir(), { recursive: true });
    }
    if (!fs.existsSync(nginxHtmlHostDir())) {
        fs.mkdirSync(nginxHtmlHostDir(), { recursive: true });
    }

    const container = await docker.createContainer({
        Image: 'certbot/certbot',
        Cmd: cmd,
        HostConfig: {
            Binds: [letsencryptBind, htmlBind],
            AutoRemove: true,
            NetworkMode: networkMode || process.env.DOCKER_PROXY_NETWORK || 'proxy-net',
        },
    });

    await container.start();
    const result = await container.wait();
    if (result.StatusCode !== 0) {
        throw new AppError(
            `SSL certificate request failed for this domain (certbot exit ${result.StatusCode}). Check DNS and try again.`,
            502
        );
    }
    return true;
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
            '/var/www/html',
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
                'renew',
                '--cert-name',
                domain,
                '--non-interactive',
                '--webroot',
                '--webroot-path',
                '/var/www/html',
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
        $or: [{ nextRenewAt: { $lte: now } }, { expiresAt: { $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() } }],
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
