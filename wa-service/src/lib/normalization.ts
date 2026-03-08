import { BusinessType } from './types';

/**
 * Normalizes user input for consistent processing
 * - Lowercases
 * - collapses spaces
 * - preserves specific markers
 */
const WORD_TO_NUMBER: Record<string, string> = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
};

export function normalizeInput(text: string): string {
    if (!text) return "";
    let normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
    // Convert word numbers to digits when the entire input is a word number
    if (WORD_TO_NUMBER[normalized]) {
        return WORD_TO_NUMBER[normalized];
    }
    return normalized;
}

/**
 * Common acknowledgment/thanks messages that should be ignored (no response)
 * These are polite responses that don't require a bot reply
 */
const IGNORED_MESSAGES: string[] = [
    'ok', 'okay', 'ok thanks', 'okay thanks',
    'thanks', 'thank you', 'thank u', 'ty', 'thx',
    'theek hai', 'theek', 'tek hai', 'thik hai', 'thik',
    'sahi hai', 'sahi',
    'done', 'done thanks', 'done thank you',
    'got it', 'gotcha', 'understood',
    'alright', 'alright thanks',
    'cool', 'cool thanks',
    'great', 'great thanks',
    'perfect', 'perfect thanks',
    'nice', 'nice thanks',
    'han', 'haan', 'ha', 'hmm', 'hm', 'hmmm',
    'ji', 'ji thanks', 'ji thank you',
    'shukria', 'shukriya',
    'allah hafiz', 'khuda hafiz',
    'bye', 'goodbye', 'see you',
    'k', 'kk', 'okkk', 'okdoki', 'okie',
    'yes ok', 'yes okay', 'yes thanks',
    'no problem', 'np', 'welcome',
    'sure', 'sure thanks'
];

/**
 * Checks if a message should be ignored (no response needed)
 * Returns true for acknowledgment/thanks messages
 */
export function shouldIgnoreMessage(text: string): boolean {
    if (!text) return false;
    const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
    // Remove trailing punctuation for matching
    const cleanNormalized = normalized.replace(/[!.?]+$/g, '').trim();
    return IGNORED_MESSAGES.includes(cleanNormalized) || IGNORED_MESSAGES.includes(normalized);
}

/**
 * Extracted entities from user text
 */
export interface ExtractedEntities {
    quantity?: number;
    size?: string;
    color?: string;
    productKeywords?: string[];
    address?: string;
    phone?: string;
    spiceLevel?: string; // Restaurant specific
    portion?: string; // Restaurant specific
    timePref?: string; // Service specific
    variant?: string;
}

// Common RegEx patterns
const PATTERNS = {
    QTY: /\b(\d+)\s*(?:pc|pcs|item|items|x|doba|qty)?\b/i,
    SIZE: /\b(small|medium|large|xl|xxl|s|m|l)\b/i,
    COLOR: /\b(red|blue|green|black|white|yellow|orange|purple|pink|brown|grey|gray)\b/i,
    PHONE: /(?:03\d{2}|923\d{2})\s?\d{7}\b/,
    SPICE: /\b(mild|medium|spicy|hot|extra hot)\b/i,
    PORTION: /\b(half|full|quarter)\b/i,
    TIME: /\b(morning|evening|afternoon|tomorrow|today|\d{1,2}(?:am|pm))\b/i
};

/**
 * Domain-Aware Entity Extraction
 */
export function extractEntities(text: string, businessType: BusinessType): ExtractedEntities {
    const normalized = normalizeInput(text);
    const entities: ExtractedEntities = {};

    // 1. Universal Extraction (Qty, Phone)
    const qtyMatch = normalized.match(PATTERNS.QTY);
    if (qtyMatch) {
        const q = parseInt(qtyMatch[1]);
        if (q > 0 && q < 100) entities.quantity = q;
    }

    const phoneMatch = normalized.match(PATTERNS.PHONE);
    if (phoneMatch) entities.phone = phoneMatch[0];

    // 2. Domain Specific Extraction
    switch (businessType) {
        case BusinessType.ECOMMERCE:
            extractEcommerceEntities(normalized, entities);
            break;
        case BusinessType.RESTAURANT:
            extractRestaurantEntities(normalized, entities);
            break;
        case BusinessType.SERVICE:
            extractServiceEntities(normalized, entities);
            break;
    }

    // 3. Address Heuristics (Weak)
    // Look for keywords like 'house', 'block', 'street', 'near'
    if (normalized.match(/\b(house|block|street|sector|near|flat|apt|colony)\b/)) {
        entities.address = text; // Return full text as address candidate if pattern matched
    }

    return entities;
}

function extractEcommerceEntities(text: string, entities: ExtractedEntities) {
    const sizeMatch = text.match(PATTERNS.SIZE);
    if (sizeMatch) entities.size = sizeMatch[1];

    const colorMatch = text.match(PATTERNS.COLOR);
    if (colorMatch) entities.color = colorMatch[1];
}

function extractRestaurantEntities(text: string, entities: ExtractedEntities) {
    const spiceMatch = text.match(PATTERNS.SPICE);
    if (spiceMatch) entities.spiceLevel = spiceMatch[1];

    const portionMatch = text.match(PATTERNS.PORTION);
    if (portionMatch) entities.portion = portionMatch[1];
}

function extractServiceEntities(text: string, entities: ExtractedEntities) {
    const timeMatch = text.match(PATTERNS.TIME);
    if (timeMatch) entities.timePref = timeMatch[0];
}
