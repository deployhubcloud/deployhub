export async function reloadNginx(docker) {
    try {

        const containers = await docker.listContainers()

        const nginx = containers.find(c => c.Names.some(n => n.includes('nginx')));

        if (!nginx) throw new Error('Nginx container not found')

        const container = docker.getContainer(nginx.Id)
        await container.kill({ signal: 'SIGHUP' })

        return 'ssl Nginx reloaded via SIGHUP'
    } catch (error) {
        return null;
    }
}