import { Worker } from 'bullmq';
import { reloadNginx } from '../../../../shared/nginx/reloadNginx.js';
import { writeNginxFileToHost } from '../utils/nginx/writeNginxFileToHost.js';
import { writeNginxConfig } from '../../../../shared/nginx/writeNginx.js';
import { checkAndPullImage } from '../../../../shared/docker/checkAndPullImage.js';
import { DEPLOY_SERVICE_ENV } from '../lib/env.js';
import { execInContainer } from '../utils/execInContainer.js';
import { docker } from '../utils/docker.js';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { connection } from '../utils/queues/queues.js';
import fs from 'fs';
import path from 'path';


const subdomainChangeWorker = new Worker(QUEUE_NAMES.SUBDOMAIN_CHANGE, async (job) => {

    const { projectId, oldSubdomain, newSubdomain, projectType, assignedPort } = job.data;

    const isProduction = DEPLOY_SERVICE_ENV.NODE_ENV === 'production';

    const localNginxSubdomainDir = path.join(process.cwd(), 'nginx/subdomains')
    if (!fs.existsSync(localNginxSubdomainDir)) {
        fs.mkdirSync(localNginxSubdomainDir, { recursive: true })
    };

    const nginxSubdomainDir = isProduction ? '/home/rahul/docker/nginx/subdomains' : localNginxSubdomainDir

    await checkAndPullImage(docker, `${DEPLOY_SERVICE_ENV.DOCKER_USERNAME}/deployhub-static-helper`);

    let nginxContainer = null;
    try {
        nginxContainer = await docker.createContainer({
            Image: `${DEPLOY_SERVICE_ENV.DOCKER_USERNAME}/deployhub-static-helper`,
            name: `deployhub-nginx-helper-${projectId}`,
            HostConfig: {
                Binds: [`${nginxSubdomainDir}:/data/nginx/subdomains`],
                AutoRemove: false,
            },
        });
        await nginxContainer.start();


        await execInContainer(nginxContainer, ['rm', '-f', `/data/nginx/subdomains/${oldSubdomain}.conf`]);
        console.log(`[subdomain-change] Deleted: ${oldSubdomain}.conf`);


        const nginxConfig = writeNginxConfig({
            type: projectType === 'static' ? 'static' : 'backend',
            staticPath: projectType === 'static' ? `/data/static/${projectId}` : undefined,
            target: projectType !== 'static' ? `http://host.docker.internal:8081` : undefined,
            domain: `${newSubdomain}.deployhub.online`,
            sslDomain: 'deployhub.cloud',
            outputPath: null,
        });


        await writeNginxFileToHost(nginxContainer, nginxConfig, '/data/nginx/subdomains', `${newSubdomain}.conf`);
        console.log(`[subdomain-change] Written: ${newSubdomain}.conf`);

    } finally {
        if (nginxContainer) {
            try {
                const info = await nginxContainer.inspect();
                if (info.State.Running) await nginxContainer.stop({ t: 5 });
            } catch (e) { console.warn(`[subdomain-change] stop failed: ${e.message}`); }
            try {
                await nginxContainer.remove({ force: true });
            } catch (e) { console.warn(`[subdomain-change] remove failed: ${e.message}`); }
        }
    }

    if (isProduction) await reloadNginx(docker);

}, { connection: connection, concurrency: 1 });

subdomainChangeWorker.on('completed', (job) => {
    console.log(`[subdomain-change] Done: ${job.data.oldSubdomain} -> ${job.data.newSubdomain}`);
});

subdomainChangeWorker.on('failed', (job, err) => {
    console.error(`[subdomain-change] Failed:`, err.message);
});