import { Worker } from 'bullmq';
import { connection } from '../utils/connection.js';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { plans } from '../../../../shared/constants/plan.js';
import { DEPLOY_SERVICE_ENV } from '../lib/env.js';
import axios from 'axios';
import { writeNginxConfig } from '../../../../shared/nginx/writeNginx.js';
import { getProjectDataById } from '../../../../shared/utils/getProjectDataById.js';
import { getBuildDataById } from '../../../../shared/utils/getBuildDataById.js';
import { buildZipUrl } from '../utils/minio/minio.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import tar from 'tar-stream';
import Docker from 'dockerode';
import { reloadNginx } from '../../../../shared/nginx/reloadNginx.js';

const docker = new Docker();


async function execInContainer(container, cmd) {
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

// wrap local file into tar stream for putArchive
async function createTarFromFile(filePath, archiveName) {
    const pack = tar.pack();
    const fileBuffer = await fs.promises.readFile(filePath);
    pack.entry({ name: archiveName, size: fileBuffer.length }, fileBuffer, (err) => {
        if (err) pack.destroy(err);
        else pack.finalize();
    });
    return pack;
}

//  Static deployment function 
async function deployStaticProject({ docker, projectId, buildId, buildsZipUrl, staticRoot }) {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `deployhub-${projectId}-`));
    const zipPath = path.join(tempDir, 'build.zip');
    let container = null;

    try {

        // 1. Download ZIP from MinIO
        console.log(`[deploy-static] Downloading zip project=${projectId} build=${buildId}`);
        const response = await axios({ method: 'GET', url: buildsZipUrl, responseType: 'stream' });
        await pipeline(response.data, fs.createWriteStream(zipPath));


        // 2. Create & start helper container
        container = await docker.createContainer({
            Image: 'deployhub-static-helper',
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
        const tarStream = await createTarFromFile(zipPath, 'build.zip');
        await container.putArchive(tarStream, { path: targetDir });


        // 5. Unzip inside container
        await execInContainer(container, ['unzip', '-o', `${targetDir}/build.zip`, '-d', targetDir]);


        // 6. Delete zip inside container
        await execInContainer(container, ['rm', '-f', `${targetDir}/build.zip`]);
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



const deployWorker = new Worker(QUEUE_NAMES.DEPLOY, async (job) => {

    const { projectId, plan, userId, buildId, firstTime } = job.data;
    console.log(job.data);

    let projectData;
    let buildData;

    try {
        const userPlan = plans[plan];
        console.log(userPlan);

        let userGithubToken;
        if (userPlan.github_Ci_Cd) {
            userGithubToken = await getUserGithubAccessToken(
                axios,
                DEPLOY_SERVICE_ENV.IDENTITY_SERVICE_URL,
                userId,
                DEPLOY_SERVICE_ENV.INTERNAL_SERVICE_TALKING_SECRET,
                DEPLOY_SERVICE_ENV.INTERNAL_SECRET
            );
        }
        console.log(userGithubToken);


        // Fetch project & build data
        projectData = await getProjectDataById(
            axios,
            projectId,
            DEPLOY_SERVICE_ENV.PROJECT_SERVICE_URL,
            DEPLOY_SERVICE_ENV.INTERNAL_SECRET,
            DEPLOY_SERVICE_ENV.INTERNAL_SERVICE_TALKING_SECRET
        );

        buildData = await getBuildDataById(
            axios,
            buildId,
            DEPLOY_SERVICE_ENV.BUILD_SERVICE_URL,
            DEPLOY_SERVICE_ENV.INTERNAL_SECRET,
            DEPLOY_SERVICE_ENV.INTERNAL_SERVICE_TALKING_SECRET
        );

        // Static
        if (projectData.type === 'static') {
            const staticRoot = DEPLOY_SERVICE_ENV.NODE_ENV === 'production' ? '/home/rahul/userdata/docker/data/static' : 'G:/deploy-micro/docker/rabbitmq/docker/data/static';

            const buildsZipUrl = await buildZipUrl(`buildzip/${projectId}/${buildId}.zip`);

            await deployStaticProject({
                docker,
                projectId: projectId.toString(),
                buildId: buildId.toString(),
                buildsZipUrl,
                staticRoot,
            });

            await DEPLOY_SERVICE_ENV.NODE_ENV === 'production' ? reloadNginx() : ""


        } else {

            

        }





    } catch (error) {
        console.error(error);
        throw error;
    }

}, { connection, concurrency: 1 });

deployWorker.on('completed', (job) => {
    console.log('Deployment work completed');
});

deployWorker.on('failed', (job, err) => {
    console.error('Job Failed');
    console.error(err);
});