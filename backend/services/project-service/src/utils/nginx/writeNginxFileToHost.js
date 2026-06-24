import tar from 'tar-stream';

export async function writeNginxFileToHost(container, content, destDir, destFileName) {
    const fileBuffer = Buffer.from(content, 'utf-8');

    const pack = tar.pack();
    pack.entry({ name: destFileName, size: fileBuffer.length }, fileBuffer, (err) => {
        if (err) pack.destroy(err);
        else pack.finalize();
    });

    await container.putArchive(pack, { path: destDir });
    console.log(`[write-to-host] Written -> container:${destDir}/${destFileName}`);
}