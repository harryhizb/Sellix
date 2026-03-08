// ========================================
// Configuration Constants and Feature Flags
// Production-Ready WhatsApp Bot Logic
// ========================================

/**
 * Session management configuration
 */
export const SESSION_TIMEOUT_MINUTES = parseInt(
    process.env.SESSION_TIMEOUT_MINUTES || '20',
    10
);

/**
 * Escalation threshold (number of fallbacks before escalation)
 */
export const ESCALATION_THRESHOLD = parseInt(
    process.env.ESCALATION_THRESHOLD || '3',
    10
);

/**
 * Confidence threshold for AI fallback
 * If intent confidence < this value, use AI fallback (if enabled)
 */
export const AI_FALLBACK_THRESHOLD = parseInt(
    process.env.AI_FALLBACK_THRESHOLD || '60',
    10
);

/**
 * Confidence threshold for immediate human escalation
 * If intent confidence < this value, escalate immediately
 */
export const HUMAN_ESCALATION_FALLBACK_THRESHOLD = parseInt(
    process.env.HUMAN_ESCALATION_FALLBACK_THRESHOLD || '40',
    10
);

/**
 * Maximum quantity per product in cart
 */
export const MAX_QTY_PER_PRODUCT = parseInt(
    process.env.MAX_QTY_PER_PRODUCT || '10',
    10
);

/**
 * OpenAI rate limit (requests per minute)
 */
export const RATE_LIMIT_OPENAI = parseInt(
    process.env.RATE_LIMIT_OPENAI || '30',
    10
);

/**
 * Enable/disable AI fallback globally
 */
export const AI_FALLBACK_ENABLED =
    process.env.AI_FALLBACK_ENABLED !== 'false'; // Default true

/**
 * Message buffer window (milliseconds) for multi-message handling
 */
export const MESSAGE_BUFFER_WINDOW_MS = parseInt(
    process.env.MESSAGE_BUFFER_WINDOW_MS || '1500',
    10
);

/**
 * Redis URL for session storage
 */
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Session snapshot interval (minutes)
 * How often to snapshot active sessions to MongoDB
 */
export const SESSION_SNAPSHOT_INTERVAL_MINUTES = parseInt(
    process.env.SESSION_SNAPSHOT_INTERVAL_MINUTES || '5',
    10
);

/**
 * Price tolerance percentage
 * If price changes by less than this percentage, don't flag as mismatch
 */
export const PRICE_TOLERANCE_PERCENTAGE = parseFloat(
    process.env.PRICE_TOLERANCE_PERCENTAGE || '5.0'
);

/**
 * Webhook URLs for notifications
 */
export const WEBHOOK_URL_SLACK = process.env.WEBHOOK_URL_SLACK || '';
export const WEBHOOK_URL_ADMIN_EMAIL = process.env.WEBHOOK_URL_ADMIN_EMAIL || '';

/**
 * Feature flags
 */
export const FEATURE_FLAGS = {
    ENABLE_PRICE_SNAPSHOT: process.env.ENABLE_PRICE_SNAPSHOT !== 'false',
    ENABLE_SESSION_SNAPSHOTS: process.env.ENABLE_SESSION_SNAPSHOTS !== 'false',
    ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS !== 'false',
    ENABLE_PII_MASKING: process.env.ENABLE_PII_MASKING !== 'false',
    ENABLE_MESSAGE_BUFFERING: process.env.ENABLE_MESSAGE_BUFFERING !== 'false',
} as const;

/**
 * Validation configuration
 */
export const VALIDATION_CONFIG = {
    MIN_PRODUCT_NAME_LENGTH: 2,
    MAX_PRODUCT_NAME_LENGTH: 200,
    MIN_QUANTITY: 1,
    MAX_CART_ITEMS: 50,
    MIN_ADDRESS_LENGTH: 10,
    MAX_ADDRESS_LENGTH: 500,
} as const;

/**
 * Log levels
 */
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/**
 * OpenAI configuration
 */
export const OPENAI_CONFIG = {
    MODEL: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10),
    TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    CACHE_TTL_SECONDS: parseInt(process.env.OPENAI_CACHE_TTL_SECONDS || '3600', 10),
} as const;

/**
 * Human handoff message
 */
export const HUMAN_HANDOFF_MESSAGE = {
    en: "A customer service representative will be with you shortly. Please wait...",
    ur_roman: "Customer service representative jald hi aap se baat karega. Meherbani karke intezar karein..."
} as const;

/**
 * Export all constants as a single config object for convenience
 */
export const CONFIG = {
    SESSION_TIMEOUT_MINUTES,
    ESCALATION_THRESHOLD,
    AI_FALLBACK_THRESHOLD,
    HUMAN_ESCALATION_FALLBACK_THRESHOLD,
    MAX_QTY_PER_PRODUCT,
    RATE_LIMIT_OPENAI,
    AI_FALLBACK_ENABLED,
    MESSAGE_BUFFER_WINDOW_MS,
    REDIS_URL,
    SESSION_SNAPSHOT_INTERVAL_MINUTES,
    PRICE_TOLERANCE_PERCENTAGE,
    WEBHOOK_URL_SLACK,
    WEBHOOK_URL_ADMIN_EMAIL,
    FEATURE_FLAGS,
    VALIDATION_CONFIG,
    LOG_LEVEL,
    OPENAI_CONFIG,
    HUMAN_HANDOFF_MESSAGE,
} as const;
