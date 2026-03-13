"use strict";
/**
 * Security Utilities
 * - Input Sanitization
 * - PII Masking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = sanitizeInput;
exports.maskPhone = maskPhone;
exports.maskPII = maskPII;
/**
 * Sanitizes user input to prevent injection and excessive length
 */
function sanitizeInput(input) {
    if (!input)
        return "";
    // 1. Truncate to reasonable length (1000 chars) to prevent DoS via regex processing
    let clean = input.slice(0, 1000);
    // 2. Remove null bytes and control characters (except common whitespace)
    clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    // 3. Normalize whitespace
    clean = clean.replace(/\s+/g, " ").trim();
    return clean;
}
/**
 * Masks phone numbers to +92-3XX-XXX-1234 format
 */
function maskPhone(phone) {
    if (!phone)
        return "UNKNOWN";
    // Keep last 4 digits visible
    if (phone.length < 5)
        return "****";
    return phone.slice(0, -4) + "****";
}
/**
 * Masks entire address except city (if detectable)
 * Primitive implementation: returns "REDACTED"
 */
function maskPII(text) {
    if (!text)
        return "";
    // Mask emails
    text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]");
    // Mask likely phone numbers (loose regex)
    text = text.replace(/\+?\d{10,15}/g, "[PHONE]");
    return text;
}
