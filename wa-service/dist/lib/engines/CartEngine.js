"use strict";
/**
 * CartEngine — handles product-based shopping flows
 * Capability: supportsProducts + supportsCart
 *
 * Deterministic state machine — each handler maps to exactly one BotState.
 * NEVER calls handleMainMenu() or resets state without explicit instruction.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartEngine = void 0;
const types_1 = require("../types");
const ProductService_1 = require("../ProductService");
const OrderService_1 = require("../OrderService");
const productUtils_1 = require("../utils/productUtils");
const inputParser_1 = require("../utils/inputParser");
const TemplateRegistry_1 = require("../templates/TemplateRegistry");
const normalization_1 = require("../normalization");
const cartUtils_1 = require("../utils/cartUtils");
class CartEngine {
    // ──────────────────────────────────────────────────────────────────────────
    // BROWSING
    // ──────────────────────────────────────────────────────────────────────────
    handleBrowse(session, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const products = yield ProductService_1.productService.getProducts(session.businessId, { limit: 10 });
            session.lastShownProducts = products;
            const currency = ((_a = context.settings) === null || _a === void 0 ? void 0 : _a.currency) || context.currency || 'USD';
            const response = TemplateRegistry_1.TemplateRegistry.productList(products, currency);
            return { response, newState: types_1.BotState.BROWSING_PRODUCTS, updatedSession: session };
        });
    }
    handleProductBrowsing(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const input = (0, normalization_1.normalizeInput)(message);
            if (input.includes('back'))
                return this.handleBrowse(session, context);
            const productNum = (0, inputParser_1.isListSelection)(input);
            if (productNum && session.lastShownProducts && session.lastShownProducts[productNum - 1]) {
                const selectedProduct = session.lastShownProducts[productNum - 1];
                session.meta = Object.assign(Object.assign({}, session.meta), { focusingProduct: selectedProduct });
                session.currentProduct = selectedProduct;
                const currency = ((_a = context.settings) === null || _a === void 0 ? void 0 : _a.currency) || context.currency || 'USD';
                const response = TemplateRegistry_1.TemplateRegistry.productFlow(selectedProduct, currency);
                // Multiple images are now handled by TemplateRegistry.productFlow
                // which adds additionalImageUrls to the response
                return { response, newState: types_1.BotState.VIEWING_PRODUCT, updatedSession: session };
            }
            // Invalid selection — re-show catalog
            return this.handleBrowse(session, context);
        });
    }
    // ──────────────────────────────────────────────────────────────────────────
    // VIEWING PRODUCT
    // ──────────────────────────────────────────────────────────────────────────
    handleViewingProduct(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const input = (0, normalization_1.normalizeInput)(message);
            const product = (_a = session.meta) === null || _a === void 0 ? void 0 : _a.focusingProduct;
            if (input.includes('back') || input === '2')
                return this.handleBrowse(session, context);
            if (input === '3' || input === 'cmd_menu') {
                const storeUrl = context.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${context.slug}` : undefined;
                return { response: TemplateRegistry_1.TemplateRegistry.mainMenu(context.name || 'Menu', context.capabilities, storeUrl), newState: types_1.BotState.MAIN_MENU, updatedSession: session };
            }
            if (input.includes('add') || input.includes('buy') || input === '1' ||
                message.trim().toLowerCase().startsWith('cmd_add_cart')) {
                if (!product)
                    return this.handleBrowse(session, context);
                const productWithVariants = (0, productUtils_1.normalizeProductVariants)(product);
                session.meta = Object.assign(Object.assign({}, session.meta), { focusingProduct: productWithVariants, selectedVariant: undefined });
                if (productWithVariants.variants && productWithVariants.variants.length > 0) {
                    const response = TemplateRegistry_1.TemplateRegistry.variantSelection(productWithVariants);
                    return { response, newState: types_1.BotState.SELECTING_VARIANT, updatedSession: session };
                }
                // No variants — ask quantity
                const response = TemplateRegistry_1.TemplateRegistry.askQuantity(productWithVariants);
                return { response, newState: types_1.BotState.AWAITING_QUANTITY, updatedSession: session };
            }
            return {
                response: {
                    text: `Type *1* to add this item to cart, *2* to return to the catalog, or *3* for the main menu.`
                },
                newState: types_1.BotState.VIEWING_PRODUCT,
                updatedSession: session
            };
        });
    }
    // ──────────────────────────────────────────────────────────────────────────
    // VARIANT SELECTION
    // ──────────────────────────────────────────────────────────────────────────
    handleVariantSelection(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const input = (0, normalization_1.normalizeInput)(message);
            const product = (_a = session.meta) === null || _a === void 0 ? void 0 : _a.focusingProduct;
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
                    newState: types_1.BotState.SELECTING_VARIANT,
                    updatedSession: session
                };
            }
            const selectedVariant = product.variants[choice - 1];
            session.meta = Object.assign(Object.assign({}, session.meta), { selectedVariant });
            const response = TemplateRegistry_1.TemplateRegistry.askQuantity(product);
            return { response, newState: types_1.BotState.AWAITING_QUANTITY, updatedSession: session };
        });
    }
    // ──────────────────────────────────────────────────────────────────────────
    // QUANTITY INPUT
    // ──────────────────────────────────────────────────────────────────────────
    handleQuantityInput(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const input = (0, normalization_1.normalizeInput)(message);
            const qty = parseInt(input);
            const product = (_a = session.meta) === null || _a === void 0 ? void 0 : _a.focusingProduct;
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
                    newState: types_1.BotState.AWAITING_QUANTITY,
                    updatedSession: session
                };
            }
            if (qty > 10) {
                return {
                    response: {
                        text: `For bulk orders over 10 items, please contact us. Maximum quantity per item is 10.\n\n_Type MENU to cancel._`
                    },
                    newState: types_1.BotState.AWAITING_QUANTITY,
                    updatedSession: session
                };
            }
            // Resolve price
            const variant = (_b = session.meta) === null || _b === void 0 ? void 0 : _b.selectedVariant;
            let finalPrice = product.price || 0;
            if (variant === null || variant === void 0 ? void 0 : variant.price) {
                finalPrice = variant.price;
            }
            else if (product.salePrice && product.salePrice < product.price) {
                finalPrice = product.salePrice;
            }
            // Build item name (include variant attributes)
            let itemName = product.name;
            if (variant) {
                const attrs = [];
                if ((_c = variant.attributes) === null || _c === void 0 ? void 0 : _c.color)
                    attrs.push(`Color: ${variant.attributes.color}`);
                if ((_d = variant.attributes) === null || _d === void 0 ? void 0 : _d.size)
                    attrs.push(`Size: ${variant.attributes.size}`);
                if ((_e = variant.attributes) === null || _e === void 0 ? void 0 : _e.material)
                    attrs.push(`Material: ${variant.attributes.material}`);
                if (variant.name)
                    attrs.unshift(variant.name);
                if (attrs.length > 0)
                    itemName = `${product.name} (${attrs.join(', ')})`;
            }
            // Build discount info — product.discount is the canonical field
            let discount;
            if (((_f = product.discount) === null || _f === void 0 ? void 0 : _f.value) && product.discount.value > 0) {
                discount = product.discount;
            }
            const cartItem = {
                productId: (product._id || product.id).toString(),
                name: itemName,
                qty,
                unitPrice: finalPrice,
                variantId: variant ? (variant.sku || ((_g = variant._id) === null || _g === void 0 ? void 0 : _g.toString()) || variant.id) : undefined,
                size: (_h = variant === null || variant === void 0 ? void 0 : variant.attributes) === null || _h === void 0 ? void 0 : _h.size,
                color: (_j = variant === null || variant === void 0 ? void 0 : variant.attributes) === null || _j === void 0 ? void 0 : _j.color,
                variantAttributes: variant === null || variant === void 0 ? void 0 : variant.attributes,
                discount
            };
            const added = (0, cartUtils_1.addToCart)(session, cartItem);
            if (!added) {
                return {
                    response: {
                        text: `Your cart is full (max 10 items). Please checkout or remove items first.\n\nReply:\n1️⃣ View Cart\n2️⃣ Checkout`
                    },
                    newState: types_1.BotState.CART_ACTIVE,
                    updatedSession: session
                };
            }
            // Remember which item index for optional notes step
            session.meta = Object.assign(Object.assign({}, session.meta), { pendingCartItemIndex: session.cart.length - 1 });
            const total = (0, cartUtils_1.calculateTotal)(session.cart);
            const currency = ((_k = context.settings) === null || _k === void 0 ? void 0 : _k.currency) || context.currency || 'USD';
            const response = TemplateRegistry_1.TemplateRegistry.cartUpdated(cartItem, session.cart, total, currency);
            return { response, newState: types_1.BotState.CART_ACTIVE, updatedSession: session };
        });
    }
    // ──────────────────────────────────────────────────────────────────────────
    // PRODUCT NOTES (optional step after adding to cart)
    // ──────────────────────────────────────────────────────────────────────────
    handleProductNotes(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const input = (0, normalization_1.normalizeInput)(message);
            const itemIndex = (_a = session.meta) === null || _a === void 0 ? void 0 : _a.pendingCartItemIndex;
            if (input === 'no' || input === 'skip' || input === 'none' || input === 'cmd_menu') {
                const total = (0, cartUtils_1.calculateTotal)(session.cart);
                const currency = ((_b = context.settings) === null || _b === void 0 ? void 0 : _b.currency) || context.currency || 'USD';
                return {
                    response: TemplateRegistry_1.TemplateRegistry.cartSummary(session.cart, total, currency),
                    newState: types_1.BotState.CART_ACTIVE,
                    updatedSession: session
                };
            }
            if (itemIndex !== undefined && session.cart[itemIndex]) {
                session.cart[itemIndex].specialInstructions = message.trim();
            }
            const total = (0, cartUtils_1.calculateTotal)(session.cart);
            const currency = ((_c = context.settings) === null || _c === void 0 ? void 0 : _c.currency) || context.currency || 'USD';
            return {
                response: TemplateRegistry_1.TemplateRegistry.cartSummary(session.cart, total, currency),
                newState: types_1.BotState.CART_ACTIVE,
                updatedSession: session
            };
        });
    }
    // ──────────────────────────────────────────────────────────────────────────
    // CART VIEW
    // ──────────────────────────────────────────────────────────────────────────
    handleCart(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const input = (0, normalization_1.normalizeInput)(message);
            const currency = ((_a = context.settings) === null || _a === void 0 ? void 0 : _a.currency) || context.currency || 'USD';
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
            if (input === '3' || input === 'cmd_menu') {
                const storeUrl = context.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${context.slug}` : undefined;
                return {
                    response: TemplateRegistry_1.TemplateRegistry.mainMenu(context.name || context.businessName || 'Store', context.capabilities, storeUrl),
                    newState: types_1.BotState.MAIN_MENU,
                    updatedSession: session
                };
            }
            // Clear cart — only on explicit keyword or button, never a bare number
            if (input.includes('clear') || input === 'cmd_clear_cart') {
                session.cart = [];
                return { response: TemplateRegistry_1.TemplateRegistry.cartCleared(), newState: types_1.BotState.MAIN_MENU, updatedSession: session };
            }
            // Remove item
            const removeMatch = input.match(/(?:remove|delete|del)\s+(\d+)/);
            if (removeMatch) {
                const index = parseInt(removeMatch[1]) - 1;
                (0, cartUtils_1.removeFromCart)(session, index);
            }
            const total = (0, cartUtils_1.calculateTotal)(session.cart);
            return {
                response: TemplateRegistry_1.TemplateRegistry.cartSummary(session.cart, total, currency),
                newState: types_1.BotState.CART_ACTIVE,
                updatedSession: session
            };
        });
    }
    // ──────────────────────────────────────────────────────────────────────────
    // CHECKOUT (collect details)
    // ──────────────────────────────────────────────────────────────────────────
    handleCheckout(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!session.cart || session.cart.length === 0) {
                return { response: TemplateRegistry_1.TemplateRegistry.cartEmpty(), newState: types_1.BotState.MAIN_MENU, updatedSession: session };
            }
            const response = TemplateRegistry_1.TemplateRegistry.askCheckoutDetails();
            return { response, newState: types_1.BotState.COLLECTING_DETAILS, updatedSession: session };
        });
    }
    // ──────────────────────────────────────────────────────────────────────────
    // COLLECTING DETAILS
    // ──────────────────────────────────────────────────────────────────────────
    handleCollectingDetails(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (message.length < 5) {
                return {
                    response: TemplateRegistry_1.TemplateRegistry.askCheckoutDetails(),
                    newState: types_1.BotState.COLLECTING_DETAILS,
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
            }
            else if (message.includes('-')) {
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
            if (parts.length >= 1)
                customerName = parts[0];
            if (parts.length >= 2)
                address = parts[1];
            if (parts.length >= 3)
                city = parts[2];
            if (parts.length >= 4)
                phone = parts[3];
            if (parts.length === 1 && detailsMessage.length > 10)
                address = detailsMessage;
            session.deliveryDetails = { name: customerName, address, city, phone, instructions: specialInstructions };
            session.userDetails = Object.assign(Object.assign({}, session.userDetails), { name: customerName, address,
                city,
                phone, fullDetails: message, specialInstructions });
            const currency = ((_a = context.settings) === null || _a === void 0 ? void 0 : _a.currency) || context.currency || 'USD';
            // ──────────────────────────────────────────────────────────────────────
            // Compute order totals here in CartEngine (business logic layer).
            // TemplateRegistry only renders — it never calculates.
            // ──────────────────────────────────────────────────────────────────────
            const orderData = this.computeOrderTotals(session, context);
            const response = TemplateRegistry_1.TemplateRegistry.orderSummary(session, currency, orderData);
            return { response, newState: types_1.BotState.CONFIRMING_ORDER, updatedSession: session };
        });
    }
    // ──────────────────────────────────────────────────────────────────────────
    // PROCESS ORDER
    // ──────────────────────────────────────────────────────────────────────────
    processOrder(session, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const dd = session.deliveryDetails;
            if (!(dd === null || dd === void 0 ? void 0 : dd.address) || dd.address.trim().length < 3) {
                return { response: TemplateRegistry_1.TemplateRegistry.askCheckoutDetails(), newState: types_1.BotState.COLLECTING_DETAILS, updatedSession: session };
            }
            try {
                const order = yield OrderService_1.orderService.createOrder(session);
                session.cart = [];
                session.deliveryDetails = undefined;
                session.meta = {};
                const response = TemplateRegistry_1.TemplateRegistry.orderSuccess(order.orderNumber, dd.name || 'Customer');
                return { response, newState: types_1.BotState.IDLE, updatedSession: session };
            }
            catch (e) {
                console.error('[CartEngine] processOrder failed:', e);
                return {
                    response: {
                        text: `❌ Sorry, there was an error placing your order. Please try again.\n\nReply:\n1️⃣ Try Again\n2️⃣ Cancel`
                    },
                    newState: types_1.BotState.CONFIRMING_ORDER,
                    updatedSession: session
                };
            }
        });
    }
    // ──────────────────────────────────────────────────────────────────────────
    // COMPUTE ORDER TOTALS
    // Centralized computation so TemplateRegistry only renders, never calculates.
    // ──────────────────────────────────────────────────────────────────────────
    computeOrderTotals(session, context) {
        var _a;
        const cart = session.cart || [];
        // Subtotal: raw sum before any discounts (unitPrice * qty per line)
        const subtotal = cart.reduce((sum, item) => sum + ((item.unitPrice || 0) * item.qty), 0);
        // Use calculateTotal() — the same function used by cartUpdated — so both
        // screens always show identical totals. discountAmount is derived from the
        // difference rather than re-running getItemDiscount separately (which was
        // causing the double-multiply bug: getItemDiscount returns a per-unit value
        // but calculateTotal already applies it correctly internally).
        const deliveryFee = ((_a = context === null || context === void 0 ? void 0 : context.settings) === null || _a === void 0 ? void 0 : _a.deliveryFee) || (context === null || context === void 0 ? void 0 : context.deliveryFee) || 0;
        const totalAfterDiscount = (0, cartUtils_1.calculateTotal)(cart);
        const discountAmount = subtotal - totalAfterDiscount;
        const totalAmount = totalAfterDiscount + deliveryFee;
        return { subtotal, discountAmount, deliveryFee, totalAmount };
    }
    getConfirmationMessage(session, context) {
        var _a;
        const currency = ((_a = context.settings) === null || _a === void 0 ? void 0 : _a.currency) || context.currency || 'USD';
        const orderData = this.computeOrderTotals(session, context);
        return TemplateRegistry_1.TemplateRegistry.orderSummary(session, currency, orderData);
    }
}
exports.CartEngine = CartEngine;
