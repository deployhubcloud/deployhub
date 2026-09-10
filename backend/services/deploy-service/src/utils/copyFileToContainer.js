import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import tar from 'tar-stream';

// Stream the file with backpressure so large artifacts do not fill worker memory.
export async function copyFileToContainer(container, filePath, archiveName, targetDir) {
    const { size } = await fs.promises.stat(filePath);
    const pack = tar.pack();
    const source = fs.createReadStream(filePath);
    const entry = pack.entry({ name: archiveName, size });
    // An early Docker rejection can destroy the pack before Docker attaches a listener.
    pack.on('error', () => {});

    try {
        await Promise.all([
            pipeline(source, entry).then(() => pack.finalize()),
            Promise.resolve().then(() => container.putArchive(pack, { path: targetDir })),
        ]);
    } finally {
        source.destroy();
        entry.destroy();
        pack.destroy();
    }
}
