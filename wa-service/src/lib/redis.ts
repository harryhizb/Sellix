/**
 * Redis client — graceful null fallback if REDIS_URL is not configured.
 * All consumers must check `if (redis)` before using.
 */
import Redis from 'ioredis';

let redis: Redis | null = null;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
    let connected = false;
    const client = new Redis(redisUrl, {
        // Stop all automatic reconnects — we handle fallback ourselves
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // never retry
        lazyConnect: true,         // don't connect until .connect() is called
        enableOfflineQueue: false, // don't queue commands when disconnected
    });

    // Suppress ALL future error events on this client (prevents unhandled-error crashes)
    client.on('error', (_err) => {
        if (!connected) {
            // Only log the very first failure; after that stay silent
            console.warn('[Redis] Could not connect — running without Redis cache.');
        }
    });

    client.on('connect', () => {
        connected = true;
        console.log('[Redis] Connected');
    });

    // Try to connect once; if it fails, fully destroy the client
    client.connect()
        .then(() => {
            redis = client;
        })
        .catch(() => {
            // Permanently disconnect so ioredis stops firing error events
            client.disconnect();
            redis = null;
        });
} else {
    console.log('[Redis] REDIS_URL not set — running without Redis (in-memory fallback active).');
}

export { redis };
