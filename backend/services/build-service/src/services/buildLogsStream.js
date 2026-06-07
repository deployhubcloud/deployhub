import { AppError } from "../../../../shared/errors/AppError.js";
import { Build } from "../models/build.model.js";
import { getRedis } from '../core/redis/client.js'


export const buildLogsStreamService = async (projectId, res) => {

    if (!projectId) throw new AppError('prodectId is Required', 400);

    const redis = getRedis();


    const build = await Build.findOne({ project: projectId }).sort({ createdAt: -1 }).lean();

    if (!build) {
        throw new AppError('Build not found', 404);
    }
    
    const buildId = build?._id

    const streamKey = `build:logs:${buildId}`

    let lastId = '0'

    const poll = async () => {
        const results = await redis.xread('COUNT', 100, 'STREAMS', streamKey, lastId)
        if (results) {
            const messages = results[0][1]
            for (const [id, fields] of messages) {
                lastId = id
                const data = {}
                for (let i = 0; i < fields.length; i += 2) {
                    data[fields[i]] = fields[i + 1]
                }
                if (data.type === 'complete') {
                    res.write(`data: ${JSON.stringify(data)}\n\n`)
                    res.flush?.()
                    res.end()
                    return
                }
                res.write(`data: ${JSON.stringify({ log: data.log })}\n\n`)
                res.flush?.()
            }
        }
    }

    return poll
}