import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pipeline } from 'node:stream/promises';
import { checkAndPullImage } from '../../../../shared/docker/checkAndPullImage.js';
import { reloadNginx } from '../../../../shared/nginx/reloadNginx.js';
import { execInContainer } from '../utils/execInContainer.js';
import { copyFileToContainer } from '../utils/copyFileToContainer.js';

export async function deployStaticProject({ docker, projectId, buildId, buildsZipUrl, staticRoot, helperImage, reload = false }) {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `deployhub-${projectId}-`));
    const zipPath = path.join(tempDir, 'build.zip');
    let container = null;

    try {

        // 1. Download ZIP from MinIO
        console.log(`[deploy-static] Downloading zip project=${projectId} build=${buildId}`);
        const response = await axios({ method: 'GET', url: buildsZipUrl, responseType: 'stream' });
        await pipeline(response.data, fs.createWriteStream(zipPath));

        await checkAndPullImage(docker, helperImage);

        // 2. Create & start helper container
        container = await docker.createContainer({
            Image: helperImage,
            name: `deployhub-helper-${projectId}-${buildId}`,
            HostConfig: {
                Binds: [`${staticRoot}:/data/static`],
                AutoRemove: false,
            },
        });
        await container.start();
        console.log(`[deploy-static] Helper container started: ${container.id}`);


        // 3. Create target dir inside container
        const targetDir = `/data/static/${projectId}`;
        await execInContainer(container, ['mkdir', '-p', targetDir]);


        // 4. Copy ZIP via putArchive (needs tar stream)
        await copyFileToContainer(container, zipPath, 'build.zip', targetDir);


        // 5. Unzip inside container
        await execInContainer(container, ['unzip', '-oq', `${targetDir}/build.zip`, '-d', targetDir]);


        // 6. Delete zip inside container
        await execInContainer(container, ['rm', '-f', `${targetDir}/build.zip`]);
        if (reload) await reloadNginx(docker);
        console.log(`deploy-static Done for project=${projectId}`);

    } finally {
        if (container) {
            try {
                const info = await container.inspect();
                if (info.State.Running) await container.stop({ t: 5 });
            } catch (e) { console.warn(`[deploy-static] stop failed: ${e.message}`); }
            try {
                await container.remove({ force: true });
            } catch (e) { console.warn(`[deploy-static] remove failed: ${e.message}`); }
        }
        try {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        } catch (e) { console.warn(`[deploy-static] temp cleanup failed: ${e.message}`); }
    }
}

