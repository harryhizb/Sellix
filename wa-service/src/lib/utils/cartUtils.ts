import { CartItem, SessionContext } from '../types';
import { CONSTANTS } from '../types';
import { calculateSubtotal, calculateCartDiscount } from './discountUtils';

export const calculateTotal = (cart: CartItem[]): number => {
    const subtotal = calculateSubtotal(cart);
    const discount = calculateCartDiscount(cart);
    return Math.round((subtotal - discount) * 100) / 100;
};

export const formatCart = (cart: CartItem[], currency: string = 'PKR'): string => {
    // Deprecated: Use templates.CART_SUMMARY or productFormatter.formatCartItem
    if (cart.length === 0) return "Your cart is empty.";

    // Simple fallback using new formatCartItem logic if needed, but better to warn
    console.warn("Using deprecated formatCart utility. Please migrate to templates.");

    let text = "🛒 *Your Cart*\n\n";
    cart.forEach((item, index) => {
        text += `${index + 1}. ${item.name} x${item.qty} - ${currency} ${item.unitPrice ? item.unitPrice * item.qty : 0}\n`;
    });

    const total = calculateTotal(cart);
    text += `\n*Total: ${currency} ${total}*`;

    return text;
};

export const addToCart = (session: SessionContext, item: CartItem): boolean => {
    // Check if item exists (matching productId AND variantId)
    const existingIndex = session.cart.findIndex(i =>
        i.productId === item.productId &&
        i.variantId === item.variantId &&
        i.size === item.size &&
        i.color === item.color
    );

    if (existingIndex > -1) {
        let newQty = session.cart[existingIndex].qty + item.qty;
        if (newQty > CONSTANTS.MAX_CART_QTY) {
            newQty = CONSTANTS.MAX_CART_QTY; // Cap at max
        }
        session.cart[existingIndex].qty = newQty;

        // Update price if changed (e.g. dynamic pricing? rare for cart add, but safe to keep old price or update?)
        // Usually we keep old price or update to current invoice price. 
        // Let's assume input item has latest price.
        session.cart[existingIndex].unitPrice = item.unitPrice;
    } else {
        if (session.cart.length >= 20) return false; // Hard limit on distinct items
        session.cart.push(item);
    }
    return true;
};

export const updateCartItemQuantity = (session: SessionContext, index: number, newQty: number): boolean => {
    if (index >= 0 && index < session.cart.length) {
        if (newQty <= 0) {
            return removeFromCart(session, index);
        }
        if (newQty > CONSTANTS.MAX_CART_QTY) {
            newQty = CONSTANTS.MAX_CART_QTY;
        }
        session.cart[index].qty = newQty;
        return true;
    }
    return false;
};

export const addCartItemNotes = (session: SessionContext, index: number, notes: string): boolean => {
    if (index >= 0 && index < session.cart.length) {
        session.cart[index].specialInstructions = notes;
        return true;
    }
    return false;
};

export const editCartItemVariant = (session: SessionContext, index: number, updates: { variantId?: string, size?: string, color?: string, unitPrice?: number }): boolean => {
    if (index >= 0 && index < session.cart.length) {
        const item = session.cart[index];
        // Only update allowed fields
        if (updates.variantId) item.variantId = updates.variantId;
        if (updates.size) item.size = updates.size;
        if (updates.color) item.color = updates.color;
        if (updates.unitPrice) item.unitPrice = updates.unitPrice;
        return true;
    }
    return false;
};

export const removeFromCart = (session: SessionContext, index: number): boolean => {
    if (index >= 0 && index < session.cart.length) {
        session.cart.splice(index, 1);
        return true;
    }
    return false;
};

export const clearCart = (session: SessionContext): void => {
    session.cart = [];
};
