import { normalizeInput } from '../normalization';

/**
 * Enhanced input normalization for menu selection
 */
export const parseMenuInput = (message: string): string => {
    const clean = normalizeInput(message);

    // 1. Direct Number Mapping
    if (['1', 'one', 'first', 'i'].includes(clean)) return '1';
    if (['2', 'two', 'second', 'ii'].includes(clean)) return '2';
    if (['3', 'three', 'third', 'iii'].includes(clean)) return '3';
    if (['4', 'four', 'fourth', 'iv'].includes(clean)) return '4';
    if (['5', 'five', 'fifth', 'v'].includes(clean)) return '5';

    // 2. Keyword Mapping (Intent-like)
    if (clean.includes('product') || clean.includes('browse') || clean.includes('shop') || clean.includes('catalogue')) return '1'; // Usually Products
    if (clean.includes('delivery') || clean.includes('shipping') || clean.includes('track')) return '2'; // Context dependent, but usually Policy/Track
    if (clean.includes('contact') || clean.includes('support') || clean.includes('help')) return '3'; // Usually Contact
    if (clean.includes('policy') || clean.includes('return') || clean.includes('refund')) return '2'; // Policy context

    return clean;
};

/**
 * Checks if input is a valid list selection (1-10)
 */
export const isListSelection = (message: string): number | null => {
    const clean = normalizeInput(message);
    const num = parseInt(clean);
    if (!isNaN(num) && num >= 1 && num <= 20) {
        return num;
    }
    return null;
};
