"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateSession = getOrCreateSession;
exports.saveSession = saveSession;
exports.touchSession = touchSession;
exports.deleteSession = deleteSession;
exports.getActiveSessionsForBusiness = getActiveSessionsForBusiness;
exports.initializeSessionService = initializeSessionService;
const ioredis_1 = __importDefault(require("ioredis"));
const types_1 = require("../lib/types");
const constants_1 = require("../lib/config/constants");
// Initialize Redis client
const redis = new ioredis_1.default(constants_1.REDIS_URL);
/**
 * Get or create conversation session
 */
function getOrCreateSession(userId, businessId) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = getSessionKey(businessId, userId);
        try {
            // Try to get from Redis first (fast)
            const cached = yield redis.get(key);
            if (cached) {
                const session = JSON.parse(cached);
                yield touchSession(session);
                return session;
            }
            // Create new session
            return createDefaultSession(userId, businessId);
        }
        catch (error) {
            console.error('Error getting session:', error);
            return createDefaultSession(userId, businessId);
        }
    });
}
function createDefaultSession(userId, businessId) {
    return {
        sessionId: `${businessId}:${userId}`,
        userId,
        businessId,
        // businessType removed - capabilities come from business context
        conversationState: types_1.BotState.IDLE,
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
function saveSession(session) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = getSessionKey(session.businessId, session.userId);
        try {
            yield redis.setex(key, constants_1.SESSION_TIMEOUT_MINUTES * 60, JSON.stringify(session));
            // Snapshot disabled for brevity/compiler safety in migration
        }
        catch (error) {
            console.error('Error saving session:', error);
        }
    });
}
function touchSession(session) {
    return __awaiter(this, void 0, void 0, function* () {
        session.lastActiveAt = Date.now();
        yield saveSession(session);
    });
}
function deleteSession(businessId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = getSessionKey(businessId, userId);
        try {
            yield redis.del(key);
        }
        catch (error) {
            console.error('Error deleting session:', error);
        }
    });
}
function getActiveSessionsForBusiness(businessId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pattern = `session:${businessId}:*`;
            const keys = yield redis.keys(pattern);
            return keys;
        }
        catch (error) {
            return [];
        }
    });
}
function snapshotToMongoDB(session) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ConversationSessionModel = (yield Promise.resolve().then(() => __importStar(require('../models/ConversationSession')))).default;
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + constants_1.SESSION_TIMEOUT_MINUTES);
            yield ConversationSessionModel.findOneAndUpdate({ sessionId: session.sessionId }, {
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
            }, { upsert: true });
        }
        catch (error) {
            console.error('Error snapshotting session:', error);
        }
    });
}
function getSessionKey(businessId, userId) {
    return `session:${businessId}:${userId}`;
}
function initializeSessionService() {
    console.log('Session service initialized');
    console.log(`Redis: ${constants_1.REDIS_URL}`);
    console.log(`Session timeout: ${constants_1.SESSION_TIMEOUT_MINUTES} minutes`);
    if (constants_1.SESSION_SNAPSHOT_INTERVAL_MINUTES > 0) {
        // Placeholder for snapshot setup
    }
    redis.on('error', (err) => {
        console.error('Redis error:', err);
    });
    redis.on('connect', () => {
        console.log('Redis connected');
    });
}
