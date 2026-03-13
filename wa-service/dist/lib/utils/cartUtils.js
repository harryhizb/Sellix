"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.editCartItemVariant = exports.addCartItemNotes = exports.updateCartItemQuantity = exports.addToCart = exports.formatCart = exports.calculateTotal = void 0;
const types_1 = require("../types");
const discountUtils_1 = require("./discountUtils");
const calculateTotal = (cart) => {
    const subtotal = (0, discountUtils_1.calculateSubtotal)(cart);
    const discount = (0, discountUtils_1.calculateCartDiscount)(cart);
    return Math.round((subtotal - discount) * 100) / 100;
};
exports.calculateTotal = calculateTotal;
const formatCart = (cart, currency = 'PKR') => {
    // Deprecated: Use templates.CART_SUMMARY or productFormatter.formatCartItem
    if (cart.length === 0)
        return "Your cart is empty.";
    // Simple fallback using new formatCartItem logic if needed, but better to warn
    console.warn("Using deprecated formatCart utility. Please migrate to templates.");
    let text = "🛒 *Your Cart*\n\n";
    cart.forEach((item, index) => {
        text += `${index + 1}. ${item.name} x${item.qty} - ${currency} ${item.unitPrice ? item.unitPrice * item.qty : 0}\n`;
    });
    const total = (0, exports.calculateTotal)(cart);
    text += `\n*Total: ${currency} ${total}*`;
    return text;
};
exports.formatCart = formatCart;
const addToCart = (session, item) => {
    // Check if item exists (matching productId AND variantId)
    const existingIndex = session.cart.findIndex(i => i.productId === item.productId &&
        i.variantId === item.variantId &&
        i.size === item.size &&
        i.color === item.color);
    if (existingIndex > -1) {
        let newQty = session.cart[existingIndex].qty + item.qty;
        if (newQty > types_1.CONSTANTS.MAX_CART_QTY) {
            newQty = types_1.CONSTANTS.MAX_CART_QTY; // Cap at max
        }
        session.cart[existingIndex].qty = newQty;
        // Update price if changed (e.g. dynamic pricing? rare for cart add, but safe to keep old price or update?)
        // Usually we keep old price or update to current invoice price. 
        // Let's assume input item has latest price.
        session.cart[existingIndex].unitPrice = item.unitPrice;
    }
    else {
        if (session.cart.length >= 20)
            return false; // Hard limit on distinct items
        session.cart.push(item);
    }
    return true;
};
exports.addToCart = addToCart;
const updateCartItemQuantity = (session, index, newQty) => {
    if (index >= 0 && index < session.cart.length) {
        if (newQty <= 0) {
            return (0, exports.removeFromCart)(session, index);
        }
        if (newQty > types_1.CONSTANTS.MAX_CART_QTY) {
            newQty = types_1.CONSTANTS.MAX_CART_QTY;
        }
        session.cart[index].qty = newQty;
        return true;
    }
    return false;
};
exports.updateCartItemQuantity = updateCartItemQuantity;
const addCartItemNotes = (session, index, notes) => {
    if (index >= 0 && index < session.cart.length) {
        session.cart[index].specialInstructions = notes;
        return true;
    }
    return false;
};
exports.addCartItemNotes = addCartItemNotes;
const editCartItemVariant = (session, index, updates) => {
    if (index >= 0 && index < session.cart.length) {
        const item = session.cart[index];
        // Only update allowed fields
        if (updates.variantId)
            item.variantId = updates.variantId;
        if (updates.size)
            item.size = updates.size;
        if (updates.color)
            item.color = updates.color;
        if (updates.unitPrice)
            item.unitPrice = updates.unitPrice;
        return true;
    }
    return false;
};
exports.editCartItemVariant = editCartItemVariant;
const removeFromCart = (session, index) => {
    if (index >= 0 && index < session.cart.length) {
        session.cart.splice(index, 1);
        return true;
    }
    return false;
};
exports.removeFromCart = removeFromCart;
const clearCart = (session) => {
    session.cart = [];
};
exports.clearCart = clearCart;
