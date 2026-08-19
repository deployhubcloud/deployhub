export async function reloadNginx(docker) {
    try {
        const containers = await docker.listContainers();
        const nginx = containers.find((c) => c.Names.some((n) => n.includes('nginx')));
        if (!nginx) throw new Error('Nginx container not found');

        const container = docker.getContainer(nginx.Id);
        const exec = await container.exec({
            Cmd: ['nginx', '-t'],
            AttachStdout: true,
            AttachStderr: true,
        });
        const stream = await exec.start({ hijack: true, stdin: false });
        const chunks = [];
        await new Promise((resolve, reject) => {
            stream.on('data', (c) => chunks.push(c));
            stream.on('end', resolve);
            stream.on('error', reject);
        });
        const inspect = await exec.inspect();
        const output = Buffer.concat(chunks).toString('utf8');
        if (inspect.ExitCode && inspect.ExitCode !== 0) {
            console.error('[nginx] config test failed:', output);
            throw new Error(`nginx -t failed: ${output.slice(0, 300)}`);
        }

        await container.kill({ signal: 'SIGHUP' });
        console.log('[nginx] reloaded via SIGHUP');
        return 'ssl Nginx reloaded via SIGHUP';
    } catch (error) {
        console.error('[nginx] reload failed:', error.message);
        throw error;
    }
}
