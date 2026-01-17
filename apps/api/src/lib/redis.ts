import Redis from 'ioredis';
import { env } from './env.js';

export function createRedisClient() {
    const redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    });

    redis.on('error', (err) => {
        console.error('Redis connection error:', err);
    });

    return redis;
}

// Cache helper functions
export async function getCache<T>(redis: Redis, key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
}

export async function setCache(
    redis: Redis,
    key: string,
    value: unknown,
    ttlSeconds: number = 300
): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function deleteCache(redis: Redis, key: string): Promise<void> {
    await redis.del(key);
}
