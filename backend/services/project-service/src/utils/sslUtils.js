import dns from "dns/promises";
import { docker } from "./docker.js";
import fs from "fs";
import { checkAndPullImage } from "../../../../shared/docker/checkAndPullImage.js";
import { SslCertificate } from "../models/sslCertificate.js";
import { Project } from '../models/project.model.js';


const SERVER_IP = process.env.SERVER_IP
const CERTBOT_EMAIL = process.env.CERTBOT_EMAIL

const LETSENCRYPT_DIR = '/etc/letsencrypt/live'

const LETSENCRYPT_BIND = '/home/rahul/docker/letsencrypt:/etc/letsencrypt'
const NGINX_HTML_BIND = '/home/rahul/docker/nginx/html:/var/www/html'
const NETWORK_MODE = 'proxy-net'

export async function isDomainPointingToServer(domain) {
    try {
        const records = await dns.resolve4(domain)
        return records.includes(SERVER_IP)
    } catch {
        return false
    }
}

export async function generateCertificate(domain, projectId) {

    const isValid = await isDomainPointingToServer(domain)
    if (!isValid) return null;

    const certPath = `${LETSENCRYPT_DIR}/${domain}/fullchain.pem`;
    const existing = fs.existsSync(certPath);

    if (!existing) {

        await checkAndPullImage(docker, `certbot/certbot`);

        const container = await docker.createContainer({
            Image: 'certbot/certbot',
            Cmd: [
                'certonly',
                '--webroot',
                '--webroot-path', '/var/www/html',
                '--non-interactive',
                '--agree-tos',
                '--no-eff-email',
                '--email', CERTBOT_EMAIL,
                '--cert-name', domain,
                '-d', domain,
            ],
            HostConfig: {
                Binds: [LETSENCRYPT_BIND, NGINX_HTML_BIND],
                AutoRemove: true,
                NetworkMode: NETWORK_MODE,
            }
        })

        await container.start()
        const result = await container.wait()
        if (result.StatusCode !== 0) return null

        await container.stop();
        await container.remove({ force: true })
    }

    const issuedAt = new Date()
    const expiresAt = new Date(issuedAt)
    expiresAt.setDate(expiresAt.getDate() + 90)
    const nextRenewAt = new Date(expiresAt)
    nextRenewAt.setDate(nextRenewAt.getDate() - 5)

    const project = await Project.findById(projectId).select('userId').lean()

    await SslCertificate.findOneAndUpdate(
        { domain },
        {
            $set: {
                userId: project?.userId,
                projectId,
                domain,
                issuedAt: issuedAt.toISOString(),
                expiresAt: expiresAt.toISOString(),
                nextRenewAt,
                lastRenewAttempt: new Date(),
                status: 'active',
            }
        },
        { upsert: true, new: true }
    )

    return { issuedAt: issuedAt.toISOString(), expiresAt: expiresAt.toISOString() }
}

export async function renewCertificate(domain) {

    await checkAndPullImage(docker, `certbot / certbot`);

    const container = await docker.createContainer({
        Image: 'certbot/certbot',
        Cmd: ['renew', '--cert-name', domain, '--non-interactive'],
        HostConfig: {
            Binds: [LETSENCRYPT_BIND, NGINX_HTML_BIND],
            AutoRemove: true,
            NetworkMode: NETWORK_MODE,
        }
    })

    await container.start()
    const result = await container.wait()
    if (result.StatusCode !== 0) throw new Error(`Certbot renew failed for ${domain}`)

    const newExpiry = new Date()
    newExpiry.setDate(newExpiry.getDate() + 90)
    const nextRenewAt = new Date(newExpiry)
    nextRenewAt.setDate(nextRenewAt.getDate() - 5)

    await SslCertificate.findOneAndUpdate(
        { domain },
        {
            $set: {
                issuedAt: new Date().toISOString(),
                expiresAt: newExpiry.toISOString(),
                nextRenewAt,
                lastRenewAttempt: new Date(),
                status: 'active',
            }
        }
    )
    console.log(`[ssl] Certificate renewed for ${domain}`)
    return { expiresAt: newExpiry.toISOString() }
}