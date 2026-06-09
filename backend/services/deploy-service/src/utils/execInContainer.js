export async function execInContainer(container, cmd) {
    const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    await new Promise((resolve, reject) => {
        container.modem.demuxStream(stream, process.stdout, process.stderr);
        stream.on('end', resolve);
        stream.on('error', reject);
    });

    const inspect = await exec.inspect();
    if (inspect.ExitCode !== 0) {
        throw new Error(`Command [${cmd.join(' ')}] exited with code ${inspect.ExitCode}`);
    }
}