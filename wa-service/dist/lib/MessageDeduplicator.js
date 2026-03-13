"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageDeduplicator = void 0;
/**
 * MessageDeduplicator
 *
 * Prevents processing the same WhatsApp message twice within a 60-second window.
 * Uses Redis (SET NX EX) when available; falls back to a local Map.
 * The local map is auto-cleaned every 60 seconds.
 */
const redis_1 = require("./redis");
const DEDUP_TTL_MS = 60000; // 60 seconds
const REDIS_TTL_S = 60;
class MessageDeduplicator {
    constructor() {
        /** messageId → expiry timestamp (ms) */
        this.seen = new Map();
        // Periodic cleanup of expired in-memory entries
        setInterval(() => this.cleanup(), DEDUP_TTL_MS);
    }
    static getInstance() {
        if (!MessageDeduplicator.instance) {
            MessageDeduplicator.instance = new MessageDeduplicator();
        }
        return MessageDeduplicator.instance;
    }
    /**
     * Returns true if the message was already processed recently.
     * Side-effect: marks the message as seen when returning false.
     */
    isDuplicate(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!messageId)
                return false;
            if (redis_1.redis) {
                try {
                    // SET NX EX: only set if the key doesn't exist (atomic)
                    const result = yield redis_1.redis.set(`dedup:${messageId}`, '1', 'EX', REDIS_TTL_S, 'NX');
                    // result === null means key already existed → duplicate
                    return result === null;
                }
                catch (_a) {
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
        });
    }
    cleanup() {
        const now = Date.now();
        for (const [id, expiry] of this.seen) {
            if (now >= expiry)
                this.seen.delete(id);
        }
    }
}
exports.messageDeduplicator = MessageDeduplicator.getInstance();
