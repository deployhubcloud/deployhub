import { Worker } from "bullmq";
import fs from "fs";
import path from "path";
import { Project } from "../models/project.model.js";
import { SslCertificate } from "../models/sslCertificate.js";
import { Port } from "../models/port.model.js";
import { PendingOrder } from "../models/PendingOrder.js";
import { getRedis } from "../core/redis/client.js";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { cacheKey } from "../../../../shared/cache/cacheKey.js";
import { checkAndPullImage } from "../../../../shared/docker/checkAndPullImage.js";
import { project_env } from "../lib/env.js";
import {
    connection,
    startStopHealthCheck,
    deleteProjectBuildQueue,
    deleteProjectDeployQueue,
    deleteProjectMonitoringQueue,
    deleteProjectAnalyticsQueue,
} from "../utils/queues.js";
import { docker } from "../utils/docker.js";
import { execInContainer } from "../utils/execInContainer.js";

const LETSENCRYPT_HOST_DIR = "/home/rahul/docker/letsencrypt";
const JOB_NAME = "delete-project";

async function clearProjectRedisData(redis, projectId, projectData, port) {
    const keys = [
        `deployhub:users:project:${projectId}`,
        `deployhub:users:project:${projectId}:meta`,
        `deployhub:users:project:${projectId}:builds`,
        `deployhub:project:${projectId}:notifications-settings`,
        `deployhub:project:latestbuildId:${projectId}`,
        `deployhub:users:projects:status:${projectId}`,
        `deployhub:user:project:${projectId}:monitoring`,
    ];

    if (port) {
        keys.push(`deployhub:port:${port}`);
    }

    if (projectData?.subdomain) {
        keys.push(`deployhub:users:subdomain:${projectData.subdomain}`);
    }

    if (Array.isArray(projectData?.customDomains)) {
        for (const domain of projectData.customDomains) {
            if (domain) keys.push(`deployhub:users:customdomain:${domain}`);
        }
    }

    if (keys.length > 0) {
        await redis.del(...keys);
    }

    await redis.zrem(cacheKey.deleteProjectSchedule(), projectId.toString());
    await redis.zrem("deployhub:monitoring:schedule", projectId.toString());
}

async function cleanupCustomDomainNginxAndCerts(projectId, customDomains = []) {
    if (!customDomains.length) return;

    const isProduction = project_env.NODE_ENV === "production";
    const localNginxCustomDomainDir = path.join(process.cwd(), "nginx/custom-domains");
    if (!fs.existsSync(localNginxCustomDomainDir)) {
        fs.mkdirSync(localNginxCustomDomainDir, { recursive: true });
    }

    const nginxCustomDomainDir = isProduction
        ? "/home/rahul/docker/nginx/custom-domains"
        : localNginxCustomDomainDir;

    let nginxContainer = null;
    try {
        await checkAndPullImage(docker, `${project_env.DOCKER_USERNAME}/deployhub-static-helper`);
        nginxContainer = await docker.createContainer({
            Image: `${project_env.DOCKER_USERNAME}/deployhub-static-helper`,
            name: `deployhub-nginx-helper-delete-domains-${projectId}`,
            HostConfig: {
                Binds: [`${nginxCustomDomainDir}:/data/nginx/custom-domains`],
                AutoRemove: false,
            },
        });
        await nginxContainer.start();

        for (const domain of customDomains) {
            if (!domain) continue;
            try {
                await execInContainer(nginxContainer, [
                    "rm",
                    "-f",
                    `/data/nginx/custom-domains/${domain}.conf`,
                ]);
                console.log(`[project-delete] Deleted custom-domain nginx conf: ${domain}.conf`);
            } catch (error) {
                console.warn(`[project-delete] Custom-domain conf delete failed (${domain}): ${error.message}`);
            }
        }
    } finally {
        if (nginxContainer) {
            try {
                const info = await nginxContainer.inspect();
                if (info.State.Running) await nginxContainer.stop({ t: 5 });
            } catch (e) {
                console.warn(`[project-delete] custom-domain helper stop failed: ${e.message}`);
            }
            try {
                await nginxContainer.remove({ force: true });
            } catch (e) {
                console.warn(`[project-delete] custom-domain helper remove failed: ${e.message}`);
            }
        }
    }

    if (!isProduction) return;

    for (const domain of customDomains) {
        if (!domain) continue;
        for (const relative of [`live/${domain}`, `archive/${domain}`, `renewal/${domain}.conf`]) {
            const target = path.join(LETSENCRYPT_HOST_DIR, relative);
            try {
                if (fs.existsSync(target)) {
                    fs.rmSync(target, { recursive: true, force: true });
                    console.log(`[project-delete] Removed letsencrypt path: ${target}`);
                }
            } catch (error) {
                console.warn(`[project-delete] Letsencrypt cleanup failed (${target}): ${error.message}`);
            }
        }
    }
}

async function enqueueDownstreamDeletes(projectId, projectData) {
    const payload = {
        projectId: String(projectId),
        projectData,
    };

    await Promise.all([
        deleteProjectBuildQueue.add(JOB_NAME, payload),
        deleteProjectDeployQueue.add(JOB_NAME, payload),
        deleteProjectMonitoringQueue.add(JOB_NAME, payload),
        deleteProjectAnalyticsQueue.add(JOB_NAME, payload),
    ]);
}

const projectDeleteWorker = new Worker(
    QUEUE_NAMES.DELETE_PROJECT,
    async (job) => {
        const { projectId } = job.data;
        const redis = getRedis();

        const projectData = await Project.findById(projectId).lean();
        if (!projectData) {
            console.warn(`[project-delete] Project ${projectId} already deleted`);
            return;
        }

        try {
            await startStopHealthCheck.add("start-stop-health-check", {
                projectId,
                enabled: false,
                intervalSeconds: projectData?.monitor?.intervalSeconds || 60,
            });
        } catch (error) {
            console.warn(`[project-delete] Failed to enqueue health-check stop: ${error.message}`);
        }

        await cleanupCustomDomainNginxAndCerts(
            projectId,
            Array.isArray(projectData.customDomains) ? projectData.customDomains : []
        );

        await Project.findByIdAndDelete(projectId);
        await SslCertificate.deleteMany({ projectId });
        const portData = await Port.findOneAndDelete({ projectId });
        await PendingOrder.deleteMany({ projectId });

        const port = portData?.port || projectData.assignedPort;
        await clearProjectRedisData(redis, projectId, projectData, port);

        await enqueueDownstreamDeletes(projectId, projectData);

        console.log(`[project-delete] Project ${projectId} deleted and downstream delete jobs queued`);
    },
    {
        connection,
        concurrency: 1,
    }
);

projectDeleteWorker.on("completed", (job) => {
    console.log(`[project-delete] Job completed for projectId: ${job.data.projectId}`);
});

projectDeleteWorker.on("failed", (job, err) => {
    console.error(`[project-delete] Job failed for projectId: ${job?.data?.projectId}`, err);
});

export default projectDeleteWorker;
