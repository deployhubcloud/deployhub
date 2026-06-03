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
        console.log('Project status received', data);

        const { projectId, projectstatus, userId, userName, projectName, buildId } = data;

        await Project.findByIdAndUpdate(projectId, {
            status: projectstatus
        })

    } catch (error) {
        console.error('Error while handling project status notification', error?.message || error);
    }
})