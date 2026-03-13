export type Language = 'en' | 'ur_roman' | 'mixed';

export enum BusinessType {
    ECOMMERCE = 'ECOMMERCE',
    RESTAURANT = 'RESTAURANT',
    SERVICE = 'SERVICE',
    ORGANIZATION = 'ORGANIZATION',
    INSTITUTE = 'INSTITUTE'
}

export enum BotState {
    IDLE = 'IDLE',
    GREETING = 'GREETING',
    MAIN_MENU = 'MAIN_MENU',
    BROWSING_CATEGORIES = 'BROWSING_CATEGORIES',
    BROWSING_PRODUCTS = 'BROWSING_PRODUCTS',
    VIEWING_PRODUCT = 'VIEWING_PRODUCT',
    SELECTING_VARIANT = 'SELECTING_VARIANT',
    AWAITING_QUANTITY = 'AWAITING_QUANTITY',
    COLLECTING_PRODUCT_NOTES = 'COLLECTING_PRODUCT_NOTES',
    PRODUCT_SELECTED = 'PRODUCT_SELECTED',
    CART_ACTIVE = 'CART_ACTIVE',
    COLLECTING_DETAILS = 'COLLECTING_DETAILS',
    ORDER_DETAILS_PENDING = 'ORDER_DETAILS_PENDING',
    CONFIRMING_ORDER = 'CONFIRMING_ORDER',
    ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    ORDER_PLACED = 'ORDER_PLACED',
    HUMAN_HANDOFF = 'HUMAN_HANDOFF',
    AWAITING_HUMAN_REASON = 'AWAITING_HUMAN_REASON',
    TRACKING_ORDER = 'TRACKING_ORDER',
    VIEWING_POLICY = 'VIEWING_POLICY',
    BROWSING_COURSES = 'BROWSING_COURSES',
    BROWSING_EVENTS = 'BROWSING_EVENTS',
    BROWSING_SERVICES = 'BROWSING_SERVICES'
}

export enum Intent {
    GREETING = 'greeting',
    PRODUCT_INQUIRY = 'product_inquiry',
    ADD_TO_CART = 'add_to_cart',
    VIEW_CART = 'view_cart',
    REMOVE_FROM_CART = 'remove_from_cart',
    PLACE_ORDER = 'place_order',
    CONTROL = 'control_intent',
    CONFIRMATION = 'confirmation',
    CANCEL = 'cancel',
    HELP = 'help',
    RESTART = 'restart',
    MENU = 'menu',
    UNKNOWN = 'unknown',
    FALLBACK = 'fallback'
}

export interface ProductDiscount {
    type: 'percentage' | 'fixed';
    value: number;
    validUntil?: Date | string;
    minQuantity?: number;
}

export interface CartItem {
    variantAttributes?: any;
    productId: string;
    name?: string;
    qty: number;
    size?: string;
    color?: string;
    unitPrice?: number;
    variantId?: string;
    specialInstructions?: string;
    discount?: ProductDiscount;
}

export interface UserDetails {
    common?: {
        name?: string;
        phone?: string;
        email?: string;
    };
    delivery?: {
        address?: string;
        city?: string;
        postalCode?: string;
        specialInstructions?: string;
    };
    booking?: {
        preferredDate?: string;
        preferredTime?: string;
        serviceType?: string;
        guestCount?: number;
    };
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    email?: string;
    ageOrClass?: string;
    parentContact?: string;
    [key: string]: any;
}

export interface RuleEngineResponse {
    response: string | any;
    newState: BotState;
    updatedSession: SessionContext;
    actions?: string[];
}

export interface DeliveryDetails {
    name: string;
    address: string;
    city: string;
    phone: string;
    instructions?: string;
}

export interface SessionContext {
    sessionId: string;
    userId: string;
    businessId: string;
    // businessType removed – capabilities now come from business context
    conversationState: BotState;
    language: Language;
    cart: CartItem[];
    userDetails: UserDetails;
    deliveryDetails?: DeliveryDetails;
    memory: Record<string, any>;
    fallbackCount: number;
    lastActiveAt: number;
    isLockedToHuman: boolean;
    lastListId?: string;
    lastShownCategories?: any[];
    lastShownProducts?: any[];   // must be an array, not boolean
    currentProduct?: any;
    meta?: any;
    pendingAdditionalImages?: string[];  // For sending multiple product images
}

export interface IntentResult {
    intent: Intent;
    score: number;
    entities: Record<string, any>;
    matchedRules: string[];
}

export const SCORING = {
    HARD_MATCH: 1.0,
    STRONG_MATCH: 0.8,
    WEAK_MATCH: 0.6,
    AMBIGUOUS: 0.4
};

export const CONSTANTS = {
    SESSION_TIMEOUT_MS: 15 * 60 * 1000,
    MAX_FALLBACKS: 3,
    MAX_CART_QTY: 10,
    BATCH_WINDOW_MS: 2000,
    AI_TRIGGER_THRESHOLD: 0.6
};