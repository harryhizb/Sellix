"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCartDiscount = calculateCartDiscount;
exports.calculateSubtotal = calculateSubtotal;
exports.getItemDiscount = getItemDiscount;
/**
 * Calculate total discount for cart items
 */
function calculateCartDiscount(cart) {
    let totalDiscount = 0;
    cart.forEach(item => {
        // Check if item has discount information
        const discount = item.discount;
        if (discount && isDiscountValid(discount)) {
            // Check minimum quantity requirement
            if (discount.minQuantity && item.qty < discount.minQuantity) {
                return; // Skip this discount
            }
            const itemSubtotal = (item.unitPrice || 0) * item.qty;
            if (discount.type === 'percentage') {
                totalDiscount += itemSubtotal * (discount.value / 100);
            }
            else if (discount.type === 'fixed') {
                // Fixed discount per item
                totalDiscount += discount.value * item.qty;
            }
        }
    });
    return Math.round(totalDiscount * 100) / 100; // Round to 2 decimal places
}
/**
 * Calculate subtotal (before discounts)
 */
function calculateSubtotal(cart) {
    const subtotal = cart.reduce((sum, item) => sum + ((item.unitPrice || 0) * item.qty), 0);
    return Math.round(subtotal * 100) / 100;
}
/**
 * Check if discount is currently valid
 */
function isDiscountValid(discount) {
    if (!discount.validUntil) {
        return true; // No expiry means always valid
    }
    const expiryDate = typeof discount.validUntil === 'string'
        ? new Date(discount.validUntil)
        : discount.validUntil;
    return new Date() < expiryDate;
}
/**
 * Get applicable discount for a single item
 */
function getItemDiscount(item) {
    const discount = item.discount;
    if (!discount || !isDiscountValid(discount)) {
        return 0;
    }
    if (discount.minQuantity && item.qty < discount.minQuantity) {
        return 0;
    }
    const itemSubtotal = (item.unitPrice || 0) * item.qty;
    if (discount.type === 'percentage') {
        return Math.round(itemSubtotal * (discount.value / 100) * 100) / 100;
    }
    else if (discount.type === 'fixed') {
        return Math.round(discount.value * item.qty * 100) / 100;
    }
    return 0;
}
