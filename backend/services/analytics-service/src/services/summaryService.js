import { AppError } from "../../../../shared/errors/AppError.js";
import { getRedis } from "../redis/client.js";

export const summaryService = async (projectId) => {

    const redis = getRedis()
    const redisKey = `deployhub:user:analytics:${projectId}`;

    const [req5m, req1h, req24h, err4xx, err5xx] = await redis.mget(
        `${redisKey}:5m:req`,
        `${redisKey}:1h:req`,
        `${redisKey}:24h:req`,
        `${redisKey}:5m:err4xx`,
        `${redisKey}:5m:err5xx`
    );


    return {
        requests: {
            last5m: Number(req5m || 0),
            last1h: Number(req1h || 0),
            last24h: Number(req24h || 0),
        },
        error: {
            "4xx": Number(err4xx || 0),
            "5xx": Number(err5xx || 0),
        }
    }
}