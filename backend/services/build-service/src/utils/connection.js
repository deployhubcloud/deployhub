import { getRedis } from "../core/redis/client.js";

export const connection = async () => {
    return await getRedis();
};