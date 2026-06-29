import RedisPubSub from '../../../../shared/redis/pubSubRedis.js';
import { clearCacheProjectData } from '../../../../shared/utils/cacheProjectData.js';
import { project_env } from '../lib/env.js';
import { Project } from '../models/project.model.js'
import Redis from 'ioredis';
import { getRedis } from '../core/redis/client.js';

const redisPubSub = new RedisPubSub(
    Redis,
    {
        host: project_env.REDIS_HOST,
        port: project_env.REDIS_PORT,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
    }
);

redisPubSub.consume('deployhub:users:build:status', async (message) => {
    const redis = getRedis()
    try {

        const data = JSON.parse(message);

        const { projectId, projectstatus, userId, userName, projectName, buildId, containerId, dockerImage } = data;

        if (projectstatus === 'building') {
            await Project.findByIdAndUpdate(projectId, {
                $set: {
                    status: projectstatus,
                    buildId
                },
                $inc: {
                    totalBuilds: 1
                },
            });
        }

        if (projectstatus === 'running') {
            await Project.findByIdAndUpdate(projectId, {
                $set: {
                    status: projectstatus,
                    containerId,
                }
            });
        }


        if (projectstatus === 'failed') {
            await Project.findByIdAndUpdate(projectId, {
                $set: {
                    status: projectstatus
                }
            });
        }

        if (projectstatus === 'success') {
            await Project.findOneAndUpdate(
                {
                    _id: projectId,
                    type: { $ne: 'static' }
                },
                {
                    $set: {
                        dockerImage
                    }
                }
            );
        }

        await clearCacheProjectData(projectId, redis)

    } catch (error) {
        console.error('Error while handling project status notification', error?.message || error);
    }
})