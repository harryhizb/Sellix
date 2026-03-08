/**
 * CartEngine — handles product-based shopping flows
 * Capability: supportsProducts + supportsCart
 *
 * Deterministic state machine — each handler maps to exactly one BotState.
 * NEVER calls handleMainMenu() or resets state without explicit instruction.
 */

import { SessionContext, BotState, RuleEngineResponse, CartItem } from '../types';
import { productService } from '../ProductService';
import { orderService } from '../OrderService';
import { normalizeProductVariants } from '../utils/productUtils';
import { isListSelection } from '../utils/inputParser';
import { TemplateRegistry } from '../templates/TemplateRegistry';
import { normalizeInput } from '../normalization';
import { addToCart, calculateTotal, removeFromCart } from '../utils/cartUtils';

export class CartEngine {

    // ──────────────────────────────────────────────────────────────────────────
    // BROWSING
    // ──────────────────────────────────────────────────────────────────────────

    async handleBrowse(session: SessionContext, context: any): Promise<RuleEngineResponse> {
        const products = await productService.getProducts(session.businessId, { limit: 10 });
        session.lastShownProducts = products;

        const currency = context.settings?.currency || context.currency || 'USD';
        const response = TemplateRegistry.productList(products, currency);

        return { response, newState: BotState.BROWSING_PRODUCTS, updatedSession: session };
    }

    async handleProductBrowsing(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const input = normalizeInput(message);
        if (input.includes('back')) return this.handleBrowse(session, context);

        const productNum = isListSelection(input);
        if (productNum && session.lastShownProducts && session.lastShownProducts[productNum - 1]) {
            const selectedProduct = session.lastShownProducts[productNum - 1];
            session.meta = { ...session.meta, focusingProduct: selectedProduct };
            session.currentProduct = selectedProduct;

            const currency = context.settings?.currency || context.currency || 'USD';
            const response = TemplateRegistry.productFlow(selectedProduct, currency);

            // Multiple images are now handled by TemplateRegistry.productFlow
            // which adds additionalImageUrls to the response

            return { response, newState: BotState.VIEWING_PRODUCT, updatedSession: session };
        }

        // Invalid selection — re-show catalog
        return this.handleBrowse(session, context);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // VIEWING PRODUCT
    // ──────────────────────────────────────────────────────────────────────────

    async handleViewingProduct(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const input = normalizeInput(message);
        const product = session.meta?.focusingProduct;

        if (input.includes('back') || input === '2') return this.handleBrowse(session, context);
        if (input === '3' || input === 'cmd_menu') return { response: TemplateRegistry.mainMenu(context.name || 'Menu', context.capabilities), newState: BotState.MAIN_MENU, updatedSession: session };

        if (input.includes('add') || input.includes('buy') || input === '1' ||
            message.trim().toLowerCase().startsWith('cmd_add_cart')) {
            if (!product) return this.handleBrowse(session, context);

            const productWithVariants = normalizeProductVariants(product);
            session.meta = { ...session.meta, focusingProduct: productWithVariants, selectedVariant: undefined };

            if (productWithVariants.variants && productWithVariants.variants.length > 0) {
                const response = TemplateRegistry.variantSelection(productWithVariants);
                return { response, newState: BotState.SELECTING_VARIANT, updatedSession: session };
            }

            // No variants — ask quantity
            const response = TemplateRegistry.askQuantity(productWithVariants);
            return { response, newState: BotState.AWAITING_QUANTITY, updatedSession: session };
        }

        return {
            response: {
                text: `Type *1* to add this item to cart, *2* to return to the catalog, or *3* for the main menu.`
            },
            newState: BotState.VIEWING_PRODUCT,
            updatedSession: session
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // VARIANT SELECTION
    // ──────────────────────────────────────────────────────────────────────────

    async handleVariantSelection(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const input = normalizeInput(message);
        const product = session.meta?.focusingProduct;

        if (input.includes('back') || input === 'cmd_menu' || input === 'menu') {
            return this.handleBrowse(session, context);
        }

        if (!product || !product.variants) {
            return this.handleBrowse(session, context);
        }

        const choice = parseInt(input);
        if (isNaN(choice) || choice < 1 || choice > product.variants.length) {
            return {
                response: {
                    text: `Please select a valid option (1–${product.variants.length}).\n\n_Type MENU to cancel._`
                },
                newState: BotState.SELECTING_VARIANT,
                updatedSession: session
            };
        }

        const selectedVariant = product.variants[choice - 1];
        session.meta = { ...session.meta, selectedVariant };

        const response = TemplateRegistry.askQuantity(product);
        return { response, newState: BotState.AWAITING_QUANTITY, updatedSession: session };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // QUANTITY INPUT
    // ──────────────────────────────────────────────────────────────────────────

    async handleQuantityInput(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const input = normalizeInput(message);
        const qty = parseInt(input);
        const product = session.meta?.focusingProduct;

        if (input.includes('cancel') || input === 'cmd_menu') {
            return this.handleBrowse(session, context);
        }

        if (!product) {
            console.warn('[CartEngine] handleQuantityInput: no product in meta — redirecting to browse');
            return this.handleBrowse(session, context);
        }

        if (isNaN(qty) || qty < 1) {
            return {
                response: {
                    text: `❌ Please enter a valid number (e.g. 1, 2, 3).\n\n_Type MENU to cancel._`
                },
                newState: BotState.AWAITING_QUANTITY,
                updatedSession: session
            };
        }

        if (qty > 10) {
            return {
                response: {
                    text: `For bulk orders over 10 items, please contact us. Maximum quantity per item is 10.\n\n_Type MENU to cancel._`
                },
                newState: BotState.AWAITING_QUANTITY,
                updatedSession: session
            };
        }

        // Resolve price
        const variant = session.meta?.selectedVariant;
        let finalPrice = product.price || 0;
        if (variant?.price) {
            finalPrice = variant.price;
        } else if (product.salePrice && product.salePrice < product.price) {
            finalPrice = product.salePrice;
        }

        // Build item name (include variant attributes)
        let itemName = product.name;
        if (variant) {
            const attrs: string[] = [];
            if (variant.attributes?.color) attrs.push(`Color: ${variant.attributes.color}`);
            if (variant.attributes?.size) attrs.push(`Size: ${variant.attributes.size}`);
            if (variant.attributes?.material) attrs.push(`Material: ${variant.attributes.material}`);
            if (variant.name) attrs.unshift(variant.name);
            if (attrs.length > 0) itemName = `${product.name} (${attrs.join(', ')})`;
        }

        // Build discount info — product.discount is the canonical field
        let discount;
        if (product.discount?.value && product.discount.value > 0) {
            discount = product.discount;
        }

        const cartItem: CartItem = {
            productId: (product._id || product.id).toString(),
            name: itemName,
            qty,
            unitPrice: finalPrice,
            variantId: variant ? (variant.sku || variant._id?.toString() || variant.id) : undefined,
            size: variant?.attributes?.size,
            color: variant?.attributes?.color,
            variantAttributes: variant?.attributes,
            discount
        };

        const added = addToCart(session, cartItem);

        if (!added) {
            return {
                response: {
                    text: `Your cart is full (max 10 items). Please checkout or remove items first.\n\nReply:\n1️⃣ View Cart\n2️⃣ Checkout`
                },
                newState: BotState.CART_ACTIVE,
                updatedSession: session
            };
        }

        // Remember which item index for optional notes step
        session.meta = { ...session.meta, pendingCartItemIndex: session.cart.length - 1 };

        const total = calculateTotal(session.cart);
        const currency = context.settings?.currency || context.currency || 'USD';
        const response = TemplateRegistry.cartUpdated(cartItem, session.cart, total, currency);

        return { response, newState: BotState.CART_ACTIVE, updatedSession: session };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PRODUCT NOTES (optional step after adding to cart)
    // ──────────────────────────────────────────────────────────────────────────

    async handleProductNotes(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const input = normalizeInput(message);
        const itemIndex = session.meta?.pendingCartItemIndex;

        if (input === 'no' || input === 'skip' || input === 'none' || input === 'cmd_menu') {
            const total = calculateTotal(session.cart);
            const currency = context.settings?.currency || context.currency || 'USD';
            return {
                response: TemplateRegistry.cartSummary(session.cart, total, currency),
                newState: BotState.CART_ACTIVE,
                updatedSession: session
            };
        }

        if (itemIndex !== undefined && session.cart[itemIndex]) {
            session.cart[itemIndex].specialInstructions = message.trim();
        }

        const total = calculateTotal(session.cart);
        const currency = context.settings?.currency || context.currency || 'USD';
        return {
            response: TemplateRegistry.cartSummary(session.cart, total, currency),
            newState: BotState.CART_ACTIVE,
            updatedSession: session
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CART VIEW
    // ──────────────────────────────────────────────────────────────────────────

    async handleCart(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const input = normalizeInput(message);
        const currency = context.settings?.currency || context.currency || 'USD';

        // "1" → Checkout (consistent across cartUpdated AND cartSummary)
        if (input === '1' || input.includes('checkout') || input === 'cmd_checkout') {
            return this.handleCheckout(session, message, context);
        }

        // "2" → Keep Shopping
        // cartUpdated shows: 2️⃣ Keep Shopping
        // Previously "2" mapped to Clear Cart which conflicted with cartUpdated template.
        // Clear cart now requires explicit keyword or cmd only — never a bare "2".
        if (input === '2' || input.includes('shopping') || input.includes('browse') || input === 'cmd_browse') {
            return this.handleBrowse(session, context);
        }

        // "3" → Main Menu
        if (input === '3' || input === 'cmd_menu') {
            return {
                response: TemplateRegistry.mainMenu(context.name || context.businessName || 'Store', context.capabilities),
                newState: BotState.MAIN_MENU,
                updatedSession: session
            };
        }

        // Clear cart — only on explicit keyword or button, never a bare number
        if (input.includes('clear') || input === 'cmd_clear_cart') {
            session.cart = [];
            return { response: TemplateRegistry.cartCleared(), newState: BotState.MAIN_MENU, updatedSession: session };
        }

        // Remove item
        const removeMatch = input.match(/(?:remove|delete|del)\s+(\d+)/);
        if (removeMatch) {
            const index = parseInt(removeMatch[1]) - 1;
            removeFromCart(session, index);
        }

        const total = calculateTotal(session.cart);
        return {
            response: TemplateRegistry.cartSummary(session.cart, total, currency),
            newState: BotState.CART_ACTIVE,
            updatedSession: session
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CHECKOUT (collect details)
    // ──────────────────────────────────────────────────────────────────────────

    async handleCheckout(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        if (!session.cart || session.cart.length === 0) {
            return { response: TemplateRegistry.cartEmpty(), newState: BotState.MAIN_MENU, updatedSession: session };
        }
        const response = TemplateRegistry.askCheckoutDetails();
        return { response, newState: BotState.COLLECTING_DETAILS, updatedSession: session };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // COLLECTING DETAILS
    // ──────────────────────────────────────────────────────────────────────────

    async handleCollectingDetails(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        if (message.length < 5) {
            return {
                response: TemplateRegistry.askCheckoutDetails(),
                newState: BotState.COLLECTING_DETAILS,
                updatedSession: session
            };
        }

        // Check for special instructions (after a dash -)
        let specialInstructions = '';
        let detailsMessage = message;

        const dashIndex = message.indexOf(' - ');
        if (dashIndex > -1) {
            detailsMessage = message.substring(0, dashIndex).trim();
            specialInstructions = message.substring(dashIndex + 3).trim();
        } else if (message.includes('-')) {
            const lastDash = message.lastIndexOf('-');
            const beforeDash = message.substring(0, lastDash).trim();
            const afterDash = message.substring(lastDash + 1).trim();
            // Only treat as instructions if after-dash is longer than a phone number
            if (afterDash.length > 6 && !/^\d+$/.test(afterDash)) {
                detailsMessage = beforeDash;
                specialInstructions = afterDash;
            }
        }

        const parts = detailsMessage.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
        let customerName = 'Customer', address = '', city = '', phone = '';
        if (parts.length >= 1) customerName = parts[0];
        if (parts.length >= 2) address = parts[1];
        if (parts.length >= 3) city = parts[2];
        if (parts.length >= 4) phone = parts[3];
        if (parts.length === 1 && detailsMessage.length > 10) address = detailsMessage;

        session.deliveryDetails = { name: customerName, address, city, phone, instructions: specialInstructions };
        session.userDetails = {
            ...session.userDetails,
            name: customerName,
            address,
            city,
            phone,
            fullDetails: message,
            specialInstructions
        };

        const currency = context.settings?.currency || context.currency || 'USD';

        // ──────────────────────────────────────────────────────────────────────
        // Compute order totals here in CartEngine (business logic layer).
        // TemplateRegistry only renders — it never calculates.
        // ──────────────────────────────────────────────────────────────────────
        const orderData = this.computeOrderTotals(session, context);

        const response = TemplateRegistry.orderSummary(session, currency, orderData);
        return { response, newState: BotState.CONFIRMING_ORDER, updatedSession: session };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PROCESS ORDER
    // ──────────────────────────────────────────────────────────────────────────

    async processOrder(session: SessionContext, context: any): Promise<RuleEngineResponse> {
        const dd = session.deliveryDetails as any;
        if (!dd?.address || dd.address.trim().length < 3) {
            return { response: TemplateRegistry.askCheckoutDetails(), newState: BotState.COLLECTING_DETAILS, updatedSession: session };
        }

        try {
            const order = await orderService.createOrder(session);

            session.cart = [];
            session.deliveryDetails = undefined;
            session.meta = {};

            const response = TemplateRegistry.orderSuccess(order.orderNumber, dd.name || 'Customer');
            return { response, newState: BotState.IDLE, updatedSession: session };
        } catch (e) {
            console.error('[CartEngine] processOrder failed:', e);
            return {
                response: {
                    text: `❌ Sorry, there was an error placing your order. Please try again.\n\nReply:\n1️⃣ Try Again\n2️⃣ Cancel`
                },
                newState: BotState.CONFIRMING_ORDER,
                updatedSession: session
            };
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // COMPUTE ORDER TOTALS
    // Centralized computation so TemplateRegistry only renders, never calculates.
    // ──────────────────────────────────────────────────────────────────────────

    computeOrderTotals(session: SessionContext, context: any): {
        subtotal: number;
        discountAmount: number;
        deliveryFee: number;
        totalAmount: number;
    } {
        const cart = session.cart || [];

        // Subtotal: raw sum before any discounts (unitPrice * qty per line)
        const subtotal = cart.reduce((sum, item) => sum + ((item.unitPrice || 0) * item.qty), 0);

        // Use calculateTotal() — the same function used by cartUpdated — so both
        // screens always show identical totals. discountAmount is derived from the
        // difference rather than re-running getItemDiscount separately (which was
        // causing the double-multiply bug: getItemDiscount returns a per-unit value
        // but calculateTotal already applies it correctly internally).
        const deliveryFee = context?.settings?.deliveryFee || context?.deliveryFee || 0;
        const totalAfterDiscount = calculateTotal(cart);
        const discountAmount = subtotal - totalAfterDiscount;
        const totalAmount = totalAfterDiscount + deliveryFee;

        return { subtotal, discountAmount, deliveryFee, totalAmount };
    }

    getConfirmationMessage(session: SessionContext, context: any): any {
        const currency = context.settings?.currency || context.currency || 'USD';
        const orderData = this.computeOrderTotals(session, context);
        return TemplateRegistry.orderSummary(session, currency, orderData);
    }
}