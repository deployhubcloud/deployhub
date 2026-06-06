import RedisPubSub from '../../../../shared/redis/pubSubRedis.js';
import { project_env } from '../lib/env.js';
import { Project } from '../models/project.model.js'
import Redis from 'ioredis';


const redisPubSub = new RedisPubSub(
    Redis,
    {
        host: project_env.REDIS_HOST,
        port: project_env.REDIS_PORT,
        password: project_env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
    }
);

redisPubSub.consume('deployhub:users:build:status', async (message) => {
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

            if (dockerImage) {
                await Project.findByIdAndUpdate(projectId, {
                    $set: {
                        dockerImage
                    }
                });
            }
        }


        if (projectstatus === 'failed') {
            await Project.findByIdAndUpdate(projectId, {
                $set: {
                    status: projectstatus
                }
            });
        }

    } catch (error) {
        console.error('Error while handling project status notification', error?.message || error);
    }
})