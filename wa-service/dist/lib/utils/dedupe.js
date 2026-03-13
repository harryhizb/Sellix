"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderHash = generateOrderHash;
exports.isDuplicateOrder = isDuplicateOrder;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Order Deduplication Utility
 * Prevents double-submission of orders within a short window.
 */
// Simple in-memory cache for deduplication
// Key: Hash, Value: Timestamp
const orderHashCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
/**
 * Generates a stable hash for a cart + user combination
 */
function generateOrderHash(userId, cart, total) {
    // Sort items by productId to ensure consistent order
    const sortedItems = [...cart].sort((a, b) => {
        const idA = String(a.productId || '');
        const idB = String(b.productId || '');
        return idA.localeCompare(idB);
    });
    // 2. Create string representation
    const cartString = sortedItems.map(item => `${item.productId}:${item.qty}:${item.variantId || ''}`).join('|');
    // 3. Combine with critical fields
    const payload = `${userId}|${cartString}|${total.toFixed(2)}`;
    // 4. Hash
    return crypto_1.default.createHash('sha256').update(payload).digest('hex');
}
/**
 * Checks if this order is a duplicate.
 * If NOT duplicate, records the hash and returns false.
 * If IS duplicate, returns true.
 */
function isDuplicateOrder(userId, cart, total) {
    const hash = generateOrderHash(userId, cart, total);
    const now = Date.now();
    // Cleanup old entries lazily
    if (orderHashCache.size > 1000) {
        for (const [key, timestamp] of orderHashCache.entries()) {
            if (now - timestamp > CACHE_TTL_MS) {
                orderHashCache.delete(key);
            }
        }
    }
    if (orderHashCache.has(hash)) {
        const timestamp = orderHashCache.get(hash);
        if (now - timestamp < CACHE_TTL_MS) {
            return true;
        }
    }
    // Record new order
    orderHashCache.set(hash, now);
    return false;
}
