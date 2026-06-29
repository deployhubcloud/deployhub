import cron from 'node-cron';
import { getRedis } from '../core/redis/client.js';
import { cacheKey } from "../../../../shared/cache/cacheKey.js";
import { deleteProjectQueue } from '../utils/queues.js';

cron.schedule('* * * * *', async () => {

    const redis = getRedis();
    const rediskey = cacheKey.deleteProjectSchedule()


    const now = Date.now();

    const dueProjects = await redis.zrangebyscore(
        rediskey,
        0,
        now
    );

    for (const projectId of dueProjects) {


        try {
            await deleteProjectQueue.add('delete-project', { projectId });
            await redis.zrem(rediskey, projectId);
        } catch (err) {
            console.error(err);
        }
    }
})