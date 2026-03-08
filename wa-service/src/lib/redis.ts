/**
 * Redis client — graceful null fallback if REDIS_URL is not configured.
 * All consumers must check `if (redis)` before using.
 */
import Redis from 'ioredis';

let redis: Redis | null = null;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
    try {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 5) return null; // stop retrying
                return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
        });

        redis.on('connect', () => console.log('[Redis] Connected'));
        redis.on('error', (err) => {
            console.warn('[Redis] Error (non-fatal, falling back to in-memory):', err.message);
        });

        // Attempt the connection
        redis.connect().catch(() => {
            console.warn('[Redis] Could not connect — running without Redis cache.');
            redis = null;
        });
    } catch (err: any) {
        console.warn('[Redis] Init failed:', err.message);
        redis = null;
    }
} else {
    console.log('[Redis] REDIS_URL not set — running without Redis (in-memory fallback active).');
}

export { redis };
