/**
 * MessageDeduplicator
 *
 * Prevents processing the same WhatsApp message twice within a 60-second window.
 * Uses Redis (SET NX EX) when available; falls back to a local Map.
 * The local map is auto-cleaned every 60 seconds.
 */
import { redis } from './redis';

const DEDUP_TTL_MS = 60_000; // 60 seconds
const REDIS_TTL_S = 60;

class MessageDeduplicator {
    private static instance: MessageDeduplicator;
    /** messageId → expiry timestamp (ms) */
    private seen: Map<string, number> = new Map();

    private constructor() {
        // Periodic cleanup of expired in-memory entries
        setInterval(() => this.cleanup(), DEDUP_TTL_MS);
    }

    static getInstance(): MessageDeduplicator {
        if (!MessageDeduplicator.instance) {
            MessageDeduplicator.instance = new MessageDeduplicator();
        }
        return MessageDeduplicator.instance;
    }

    /**
     * Returns true if the message was already processed recently.
     * Side-effect: marks the message as seen when returning false.
     */
    async isDuplicate(messageId: string): Promise<boolean> {
        if (!messageId) return false;

        if (redis) {
            try {
                // SET NX EX: only set if the key doesn't exist (atomic)
                const result = await redis.set(
                    `dedup:${messageId}`,
                    '1',
                    'EX',
                    REDIS_TTL_S,
                    'NX'
                );
                // result === null means key already existed → duplicate
                return result === null;
            } catch {
                // Redis error → fall through to in-memory
            }
        }

        // In-memory path
        const now = Date.now();
        const expiry = this.seen.get(messageId);
        if (expiry !== undefined && now < expiry) {
            return true; // duplicate
        }
        this.seen.set(messageId, now + DEDUP_TTL_MS);
        return false;
    }

    private cleanup() {
        const now = Date.now();
        for (const [id, expiry] of this.seen) {
            if (now >= expiry) this.seen.delete(id);
        }
    }
}

export const messageDeduplicator = MessageDeduplicator.getInstance();
