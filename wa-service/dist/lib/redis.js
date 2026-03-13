"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
/**
 * Redis client — graceful null fallback if REDIS_URL is not configured.
 * All consumers must check `if (redis)` before using.
 */
const ioredis_1 = __importDefault(require("ioredis"));
let redis = null;
exports.redis = redis;
const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
    try {
        exports.redis = redis = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 5)
                    return null; // stop retrying
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
            exports.redis = redis = null;
        });
    }
    catch (err) {
        console.warn('[Redis] Init failed:', err.message);
        exports.redis = redis = null;
    }
}
else {
    console.log('[Redis] REDIS_URL not set — running without Redis (in-memory fallback active).');
}
