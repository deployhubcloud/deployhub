import { AppError } from "../../../../shared/errors/AppError.js";
import { getRedis } from '../core/redis/client.js';

export const streamProjectStatusService = async (projectId, res) => {

    if (!projectId) throw new AppError('projectId is Required', 400);

    const redis = getRedis();
    const streamKey = `project:status:${projectId}`;

    const latestEntries = await redis.xrevrange(streamKey, '+', '-', 'COUNT', 1);

    if (latestEntries && latestEntries.length > 0) {
        const [id, fields] = latestEntries[0];
        const payload = {};
        for (let i = 0; i < fields.length; i += 2) {
            payload[fields[i]] = fields[i + 1];
        }
        res.write(`data:${JSON.stringify({ status: payload.status })}\n\n`);
    }

    let lastId = '$';

    const heartbeat = setInterval(() => {
        if (!res.destroyed) res.write(": ping\n\n");
    }, 30000);

    res.on('close', () => {
        clearInterval(heartbeat);
    });

    while (!res.destroyed) {
        try {
            const results = await redis.xread(
                "BLOCK", 30000,
                "STREAMS", streamKey,
                lastId
            );

            if (!results) continue;

            const [, messages] = results[0];

            for (const [id, fields] of messages) {
                lastId = id;
                const payload = {};
                for (let i = 0; i < fields.length; i += 2) {
                    payload[fields[i]] = fields[i + 1];
                }
                res.write(`data:${JSON.stringify({ status: payload.status })}\n\n`);
            }
        } catch (err) {
            if (!res.destroyed) {
                res.write(`data:${JSON.stringify({ error: 'stream error' })}\n\n`);
            }
            break;
        }
    }

    clearInterval(heartbeat);
};