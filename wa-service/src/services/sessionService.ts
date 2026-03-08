import Redis from 'ioredis';
import { SessionContext, BotState } from '../lib/types';
import {
    REDIS_URL,
    SESSION_TIMEOUT_MINUTES,
    SESSION_SNAPSHOT_INTERVAL_MINUTES
} from '../lib/config/constants';

// Initialize Redis client
const redis = new Redis(REDIS_URL);

/**
 * Get or create conversation session
 */
export async function getOrCreateSession(
    userId: string,
    businessId: string
): Promise<SessionContext> {
    const key = getSessionKey(businessId, userId);

    try {
        // Try to get from Redis first (fast)
        const cached = await redis.get(key);
        if (cached) {
            const session: SessionContext = JSON.parse(cached);
            await touchSession(session);
            return session;
        }

        // Create new session
        return createDefaultSession(userId, businessId);
    } catch (error) {
        console.error('Error getting session:', error);
        return createDefaultSession(userId, businessId);
    }
}

function createDefaultSession(userId: string, businessId: string): SessionContext {
    return {
        sessionId: `${businessId}:${userId}`,
        userId,
        businessId,
        // businessType removed - capabilities come from business context
        conversationState: BotState.IDLE,
        language: 'en',
        cart: [],
        userDetails: {},
        memory: {},
        fallbackCount: 0,
        isLockedToHuman: false,
        lastActiveAt: Date.now(),
        lastShownProducts: [],
        currentProduct: null,
        meta: {}
    };
}

/**
 * Save session to Redis
 */
export async function saveSession(session: SessionContext): Promise<void> {
    const key = getSessionKey(session.businessId, session.userId);

    try {
        await redis.setex(
            key,
            SESSION_TIMEOUT_MINUTES * 60,
            JSON.stringify(session)
        );
        // Snapshot disabled for brevity/compiler safety in migration
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

export async function touchSession(session: SessionContext): Promise<void> {
    session.lastActiveAt = Date.now();
    await saveSession(session);
}

export async function deleteSession(businessId: string, userId: string): Promise<void> {
    const key = getSessionKey(businessId, userId);
    try {
        await redis.del(key);
    } catch (error) {
        console.error('Error deleting session:', error);
    }
}

export async function getActiveSessionsForBusiness(businessId: string): Promise<string[]> {
    try {
        const pattern = `session:${businessId}:*`;
        const keys = await redis.keys(pattern);
        return keys;
    } catch (error) {
        return [];
    }
}

async function snapshotToMongoDB(session: SessionContext): Promise<void> {
    try {
        const ConversationSessionModel = (await import('../models/ConversationSession')).default;
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_TIMEOUT_MINUTES);

        await ConversationSessionModel.findOneAndUpdate(
            { sessionId: session.sessionId },
            { 
                sessionId: session.sessionId,
                userId: session.userId,
                businessId: session.businessId,
                conversationState: session.conversationState,
                language: session.language,
                cart: session.cart,
                userDetails: session.userDetails,
                deliveryDetails: session.deliveryDetails,
                memory: session.memory,
                fallbackCount: session.fallbackCount,
                isLockedToHuman: session.isLockedToHuman,
                lastActiveAt: session.lastActiveAt,
                lastShownProducts: session.lastShownProducts,
                currentProduct: session.currentProduct,
                meta: session.meta,
                expiresAt 
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error snapshotting session:', error);
    }
}

function getSessionKey(businessId: string, userId: string): string {
    return `session:${businessId}:${userId}`;
}

export function initializeSessionService(): void {
    console.log('Session service initialized');
    console.log(`Redis: ${REDIS_URL}`);
    console.log(`Session timeout: ${SESSION_TIMEOUT_MINUTES} minutes`);

    if (SESSION_SNAPSHOT_INTERVAL_MINUTES > 0) {
        // Placeholder for snapshot setup
    }

    redis.on('error', (err) => {
        console.error('Redis error:', err);
    });

    redis.on('connect', () => {
        console.log('Redis connected');
    });
}