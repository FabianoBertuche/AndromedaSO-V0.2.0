import Redis from 'ioredis';
import { config } from '../config';
export const redis = new Redis(config.redisUrl);
export const setModuleState = async (id, payload) => {
    await redis.set(`module:${id}`, JSON.stringify(payload));
};
export const getModuleState = async (id) => {
    const data = await redis.get(`module:${id}`);
    return data ? JSON.parse(data) : null;
};
export const getActiveRegistry = async () => {
    const active = await redis.lrange('registry:active', 0, -1);
    return active.map((item) => JSON.parse(item));
};
//# sourceMappingURL=redis.js.map