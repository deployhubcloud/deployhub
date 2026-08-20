import { AppError } from "../../../../shared/errors/AppError.js";
import { getRedis } from "../redis/client.js";

export const summaryService = async (projectId) => {
 
    const redis = getRedis()
    const base = `deployhub:user:analytics:${projectId}`;

    const now = Date.now();
    const bucket5m = Math.floor(now / (5 * 60 * 1000));
    const bucket1h = Math.floor(now / (60 * 60 * 1000));
    const bucket24h = Math.floor(now / (24 * 60 * 60 * 1000));

    const [req5m, req1h, req24h, err4xx, err5xx, uv, geo, endpoints] = await Promise.all([
        redis.get(`${base}:5m:${bucket5m}:req`),
        redis.get(`${base}:1h:${bucket1h}:req`),
        redis.get(`${base}:24h:${bucket24h}:req`),
        redis.get(`${base}:5m:${bucket5m}:err4xx`),
        redis.get(`${base}:5m:${bucket5m}:err5xx`),
        redis.pfcount(`${base}:24h:uv`),
        redis.hgetall(`${base}:24h:${bucket24h}:geo`),
        redis.hgetall(`${base}:24h:${bucket24h}:endpoints`),
    ]);

    const topEndpoints = Object.entries(endpoints || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, count]) => ({ path, count: Number(count) }));

    const topCountries = Object.entries(geo || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({ country, count: Number(count) }));

    return {
        requests: {
            last5m: Number(req5m || 0),
            last1h: Number(req1h || 0),
            last24h: Number(req24h || 0),
        },
        error: {
            "4xx": Number(err4xx || 0),
            "5xx": Number(err5xx || 0),
        },
        uniqueVisitors: Number(uv || 0),
        topCountries,
        topEndpoints,
    }
}