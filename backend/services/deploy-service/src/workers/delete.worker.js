import { Worker } from "bullmq";
import axios from "axios";
import fs from "fs";
import path from "path";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { deleteDockerHubRepository } from "../../../../shared/docker/deleteDockerHubImage.js";
import { checkAndPullImage } from "../../../../shared/docker/checkAndPullImage.js";
import { reloadNginx } from "../../../../shared/nginx/reloadNginx.js";
import { DEPLOY_SERVICE_ENV } from "../lib/env.js";
import { Deployment } from "../model/deployment.model.js";
import { deleteObjectsByPrefix } from "../utils/minio/minio.js";
import { execInContainer } from "../utils/execInContainer.js";
import { docker } from "../utils/docker.js";
import { deleteCacheBuildData } from "../utils/cache/deleteCacheBuildData.js";
import { connection } from "../utils/queues/queues.js";

await checkAndPullImage(docker, `${DEPLOY_SERVICE_ENV.DOCKER_USERNAME}/deployhub-static-helper`);

async function stopAndRemoveContainer(containerName, containerId) {
    try {
        let container = null;

        if (containerId) {
            try {
                container = docker.getContainer(containerId);
                await container.inspect();
            } catch {
                container = null;
            }
        }

        if (!container && containerName) {
            const containers = await docker.listContainers({ all: true });
            const existing = containers.find((c) => c.Names?.includes(`/${containerName}`));
            if (existing) {
                container = docker.getContainer(existing.Id);
            }
        }

        if (!container) return;

        const info = await container.inspect();
        if (info.State?.Running) {
            await container.stop({ t: 10 });
        }
        await container.remove({ force: true });
        console.log(`[deploy-delete] Removed container ${containerName || containerId}`);
    } catch (error) {
        console.warn(`[deploy-delete] Container cleanup failed: ${error.message}`);
    }
}

async function cleanupNginxAndStatic({ projectId, subdomain, projectType, customDomains = [] }) {
    const isProduction = DEPLOY_SERVICE_ENV.NODE_ENV === "production";

    const localNginxSubdomainDir = path.join(process.cwd(), "nginx/subdomains");
    if (!fs.existsSync(localNginxSubdomainDir)) {
        fs.mkdirSync(localNginxSubdomainDir, { recursive: true });
    }

    const localNginxCustomDomainDir = path.join(process.cwd(), "nginx/custom-domains");
    if (!fs.existsSync(localNginxCustomDomainDir)) {
        fs.mkdirSync(localNginxCustomDomainDir, { recursive: true });
    }

    const localStaticRoot = path.resolve("static");
    if (!fs.existsSync(localStaticRoot)) {
        fs.mkdirSync(localStaticRoot, { recursive: true });
    }

    const nginxSubdomainDir = isProduction
        ? "/home/rahul/docker/nginx/subdomains"
        : localNginxSubdomainDir;
    const nginxCustomDomainDir = isProduction
        ? "/home/rahul/docker/nginx/custom-domains"
        : localNginxCustomDomainDir;
    const staticRoot = isProduction
        ? "/home/rahul/docker/data/static"
        : localStaticRoot;

    let nginxContainer = null;

    try {
        nginxContainer = await docker.createContainer({
            Image: `${DEPLOY_SERVICE_ENV.DOCKER_USERNAME}/deployhub-static-helper`,
            name: `deployhub-nginx-helper-delete-${projectId}`,
            HostConfig: {
                Binds: [
                    `${nginxSubdomainDir}:/data/nginx/subdomains`,
                    `${nginxCustomDomainDir}:/data/nginx/custom-domains`,
                    `${staticRoot}:/data/static`,
                ],
                AutoRemove: false,
            },
        });
        await nginxContainer.start();

        if (subdomain) {
            try {
                await execInContainer(nginxContainer, [
                    "rm",
                    "-f",
                    `/data/nginx/subdomains/${subdomain}.conf`,
                ]);
                console.log(`[deploy-delete] Deleted nginx conf: ${subdomain}.conf`);
            } catch (error) {
                console.warn(`[deploy-delete] Nginx conf delete failed: ${error.message}`);
            }
        }

        for (const domain of customDomains) {
            if (!domain) continue;
            try {
                await execInContainer(nginxContainer, [
                    "rm",
                    "-f",
                    `/data/nginx/custom-domains/${domain}.conf`,
                ]);
                console.log(`[deploy-delete] Deleted custom-domain nginx conf: ${domain}.conf`);
            } catch (error) {
                console.warn(`[deploy-delete] Custom-domain conf delete failed (${domain}): ${error.message}`);
            }
        }

        if (projectType === "static") {
            try {
                await execInContainer(nginxContainer, [
                    "rm",
                    "-rf",
                    `/data/static/${projectId}`,
                ]);
                console.log(`[deploy-delete] Deleted static files: /data/static/${projectId}`);
            } catch (error) {
                console.warn(`[deploy-delete] Static files delete failed: ${error.message}`);
            }
        }
    } finally {
        if (nginxContainer) {
            try {
                const info = await nginxContainer.inspect();
                if (info.State.Running) await nginxContainer.stop({ t: 5 });
            } catch (e) {
                console.warn(`[deploy-delete] helper stop failed: ${e.message}`);
            }
            try {
                await nginxContainer.remove({ force: true });
            } catch (e) {
                console.warn(`[deploy-delete] helper remove failed: ${e.message}`);
            }
        }
    }

    if (isProduction) {
        await reloadNginx(docker);
    }
}

const deleteWorker = new Worker(
    QUEUE_NAMES.DELETE_PROJECT_DEPLOY,
    async (job) => {
        const { projectId, projectData } = job.data;

        if (!projectId) {
            console.warn("[deploy-delete] Missing projectId");
            return;
        }

        const projectType = projectData?.type;
        const subdomain = projectData?.subdomain;
        const customDomains = Array.isArray(projectData?.customDomains)
            ? projectData.customDomains
            : [];

        await stopAndRemoveContainer(
            projectData?.dockerContainerName,
            projectData?.containerId
        );

        if (projectType && projectType !== "static") {
            await deleteDockerHubRepository({
                repository: String(projectId).toLowerCase(),
                dockerHubToken: DEPLOY_SERVICE_ENV.DOCKER_PASSWORD,
                dockerHubUsername: DEPLOY_SERVICE_ENV.DOCKER_USERNAME,
                axios,
                docker,
            });
        }

        await cleanupNginxAndStatic({ projectId, subdomain, projectType, customDomains });

        await deleteObjectsByPrefix(`buildsLogsUrl/${projectId}`);
        await deleteObjectsByPrefix(`buildzip/${projectId}`);

        await Deployment.deleteMany({ project: projectId });
        await deleteCacheBuildData(projectId);

        console.log(`[deploy-delete] Cleanup done for project ${projectId}`);
    },
    {
        connection,
        concurrency: 1,
    }
);

deleteWorker.on("completed", (job) => {
    console.log(`[deploy-delete] Job completed for projectId: ${job.data.projectId}`);
});

deleteWorker.on("failed", (job, err) => {
    console.error(`[deploy-delete] Job failed for projectId: ${job?.data?.projectId}`, err);
});

export default deleteWorker;
