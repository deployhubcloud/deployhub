import { cacheKey } from "../../../../shared/cache/cacheKey.js";
import { getRedis } from "../core/redis/client.js";
import { Project } from "../models/project.model.js";
import cron from 'node-cron'

cron.schedule('0 0 * * *', async () => {
    const redis = getRedis();
    const rediskey = cacheKey.deleteProjectSchedule()

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const cursor = Project.find({
        paymentStatus: "paid",
        status: "active",
        endDate: { $lte: tomorrow }
    }).cursor();

    for (const project of cursor) {

        const nextPingAt = new Date(project.endDate).getTime();
        const projectId = project._id;


        await redis.zadd(
            rediskey,
            nextPingAt,
            projectId.toString()
        );
    }
})