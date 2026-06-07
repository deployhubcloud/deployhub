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
import RedisPubSub from '../../../../shared/redis/pubSubRedis.js';
import Redis from 'ioredis';
import { getUserGithubAccessToken } from '../../../../shared/utils/getUserGIthubAccesstoken.js';
import { checkAndPullImage } from '../../../../shared/docker/checkAndPullImage.js';


const docker = new Docker();

const redisPubSub = new RedisPubSub(
    Redis,
    {
        host: DEPLOY_SERVICE_ENV.REDIS_HOST,
        port: DEPLOY_SERVICE_ENV.REDIS_PORT,
        password: DEPLOY_SERVICE_ENV.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
    }
);

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

        await checkAndPullImage(docker, `${DEPLOY_SERVICE_ENV.DOCKER_USERNAME}/deployhub-static-helper`)

        // 2. Create & start helper container
        container = await docker.createContainer({
            Image: `${DEPLOY_SERVICE_ENV.DOCKER_USERNAME}/deployhub-static-helper`,
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

const insertEnv = (projectEnv) => {
    const envVariables = [];
    if (projectEnv) {
        for (const [key, value] of Object.entries(projectEnv)) {
            envVariables.push(`${key}=${encryptedValue}`);
        }
    }

    return envVariables
}

export const ensureNetworkExists = async (networkName) => {
    try {
        const networks = await docker.listNetworks();

        const existingNetwork = networks.find(
            network => network.Name === networkName
        );

        if (existingNetwork) {
            return existingNetwork.Id;
        }

        const network = await docker.createNetwork({
            Name: networkName,
            Driver: 'bridge'
        });

        return network.id;
    } catch (error) {
        throw new Error(
            `Failed to ensure network '${networkName}' exists: ${error.message}`
        );
    }
};

const parseRam = (ram) => {
    const mb = parseInt(ram.replace('mb', ''));
    return mb * 1024 * 1024;
};

const parseCpu = (cpu) => {
    return Number(cpu) * 1e9;
};



const deployWorker = new Worker(QUEUE_NAMES.DEPLOY, async (job) => {

    const { projectId, plan, userId, buildId, firstTime } = job.data;


    let projectData;
    let buildData;
    let userGithubToken;
    let userPlan;

    try {
        userPlan = plans[plan];

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

            // here i send pub/sub of project status so every service listen and work
            await redisPubSub.produce('deployhub:users:build:status', JSON.stringify({
                projectId: projectData._id,
                projectstatus: "running",
                userId: userId,
                projectName: projectData.name,
                buildId: buildData._id,
                serviceType: projectData.isMicroservice ? "microservice" : projectData.type,
            }));

        } else {

            // ye hai host port means user ko host pe kon sa port assign hua hai
            const hostPort = projectData.assignedPort;

            //ye hai user ka internal port jsipe server chal raha hai
            const projectPort = projectData.port || 3000;

            // ye hai user ka environment variable user ka
            const envVariables = insertEnv(projectData?.env)

            // ye hai container name
            const containerName = projectData.dockerContainerName

            // ye hai docker network name
            const dockerNetworkName = projectData.networkName;

            // ye hai image ka name
            const imageName = `${DEPLOY_SERVICE_ENV.DOCKER_USERNAME}/${projectId.toString().toLowerCase()}:${buildId.toString().toLowerCase()}`;

            // ye hai req type means aagr local pe hai ho http nhi to https
            const reqType = DEPLOY_SERVICE_ENV.NODE_ENV === 'production' ? 'https://' : "http://"

            //ye hai deployment url
            let deploymentUrl;

            const isMicroservice = projectData?.isMicroservice
            if (isMicroservice) {
                deploymentUrl = `http://${containerName}:${projectPort}`
            } else {
                if (projectData?.customDomains?.length > 0) {
                    deploymentUrl = `${reqType}${projectData.customDomains}`
                } else {
                    deploymentUrl = DEPLOY_SERVICE_ENV === 'production' ? `${reqType}${projectData?.subdomain}.deployhub.online` : `${reqType}localhost:${hostPort}`
                }
            }

            await checkAndPullImage(docker, imageName)
            await ensureNetworkExists(dockerNetworkName);

            const container = await docker.createContainer({
                Image: imageName,
                name: `${containerName}`,
                Env: envVariables,
                ExposedPorts: {
                    [`${parseInt(projectPort)}/tcp`]: {}
                },
                HostConfig: {
                    NetworkMode: dockerNetworkName,
                    Memory: parseRam(userPlan.resources.ram),
                    NanoCpus: parseCpu(userPlan.resources.cpu),
                    StorageOpt: {
                        size: `${userPlan.resources.storage}M`
                    },
                    PortBindings: {
                        [`${parseInt(projectPort)}/tcp`]: [
                            {
                                HostPort: String(hostPort)
                            }
                        ]
                    }
                }
            });

            await container.start();
            await container.logs({ stdout: true, stderr: true });

            // here i send pub/sub of project status so every service listen and work
            await redisPubSub.produce('deployhub:users:build:status', JSON.stringify({
                projectId: projectData._id,
                projectstatus: "running",
                userId: userId,
                projectName: projectData.name,
                buildId: buildData._id,
                serviceType: projectData.isMicroservice ? "microservice" : projectData.type,
                deploymentUrl: deploymentUrl,

            }));
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