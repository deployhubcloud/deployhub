

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