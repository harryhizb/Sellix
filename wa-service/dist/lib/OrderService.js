"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.OrderService = void 0;
const discountUtils_1 = require("./utils/discountUtils");
const cartUtils_1 = require("./utils/cartUtils");
const BusinessService_1 = require("./BusinessService");
const CustomerService_1 = require("./CustomerService");
const WhatsAppSessionManager_1 = require("./WhatsAppSessionManager");
const Order_1 = require("../models/Order");
const db_1 = require("../config/db");
const TemplateRegistry_1 = require("./templates/TemplateRegistry");
const mongoose_1 = __importDefault(require("mongoose"));
class OrderService {
    createOrder(session) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9;
            try {
                yield (0, db_1.connectDB)();
                if (!session.cart || session.cart.length === 0) {
                    throw new Error('Cannot create order: Cart is empty');
                }
                if (!session.businessId) {
                    throw new Error('Cannot create order: Missing businessId');
                }
                console.log(`[OrderService] Creating order for user ${session.userId}, cart items: ${session.cart.length}`);
                const businessContext = yield BusinessService_1.businessService.getBusinessContext(session.businessId);
                const currency = ((_a = businessContext === null || businessContext === void 0 ? void 0 : businessContext.settings) === null || _a === void 0 ? void 0 : _a.currency) || 'PKR';
                const deliveryFee = ((_b = businessContext === null || businessContext === void 0 ? void 0 : businessContext.settings) === null || _b === void 0 ? void 0 : _b.deliveryFee) || 0;
                const caps = (businessContext === null || businessContext === void 0 ? void 0 : businessContext.capabilities) || {};
                // Determine order type based on capabilities
                let orderType = 'order';
                if (caps.supportsBooking) {
                    orderType = 'booking';
                }
                else if (caps.supportsInformation) {
                    // Institutes might not create orders, but if they do, treat as 'enrollment'
                    orderType = 'enrollment';
                }
                const subtotal = (0, discountUtils_1.calculateSubtotal)(session.cart);
                const discountAmount = (0, discountUtils_1.calculateCartDiscount)(session.cart);
                const total = orderType === 'order'
                    ? Math.round(((0, cartUtils_1.calculateTotal)(session.cart) + deliveryFee) * 100) / 100
                    : Math.round((0, cartUtils_1.calculateTotal)(session.cart) * 100) / 100;
                console.log(`[OrderService] Type: ${orderType}, Totals - Subtotal: ${subtotal}, Discount: ${discountAmount}, Delivery: ${deliveryFee}, Total: ${total}`);
                const customer = yield CustomerService_1.customerService.getOrCreateCustomer(session.businessId, session.userId, session.userDetails);
                if (!customer)
                    throw new Error('Failed to create/retrieve customer');
                const orderItems = session.cart.map(item => ({
                    productId: item.productId || undefined,
                    name: item.name || 'Unknown Product',
                    quantity: item.qty,
                    price: item.unitPrice || 0,
                    total: (item.unitPrice || 0) * item.qty,
                    size: item.size,
                    color: item.color,
                    attributes: item.variantId ? { variantId: item.variantId } : undefined
                }));
                const orderData = {
                    businessId: new mongoose_1.default.Types.ObjectId(session.businessId),
                    customerId: customer._id,
                    type: orderType,
                    items: orderItems,
                    subtotal,
                    discountAmount,
                    deliveryFee: orderType === 'order' ? deliveryFee : 0,
                    totalAmount: total,
                    currency,
                    status: 'pending', // Will be auto-approved later if business doesn't require approval
                    customerInfo: {
                        name: ((_c = session.deliveryDetails) === null || _c === void 0 ? void 0 : _c.name) || ((_e = (_d = session.userDetails) === null || _d === void 0 ? void 0 : _d.common) === null || _e === void 0 ? void 0 : _e.name) || ((_f = session.userDetails) === null || _f === void 0 ? void 0 : _f.name) || customer.name || '',
                        phone: session.userId, // Always use the actual WhatsApp number (session.userId)
                        altPhone: ((_g = session.deliveryDetails) === null || _g === void 0 ? void 0 : _g.phone) || undefined, // Store delivery phone separately if different
                        email: ((_j = (_h = session.userDetails) === null || _h === void 0 ? void 0 : _h.common) === null || _j === void 0 ? void 0 : _j.email) || ((_k = session.userDetails) === null || _k === void 0 ? void 0 : _k.email) || customer.email || undefined
                    },
                    specialInstructions: ((_m = (_l = session.userDetails) === null || _l === void 0 ? void 0 : _l.delivery) === null || _m === void 0 ? void 0 : _m.specialInstructions) || ((_o = session.userDetails) === null || _o === void 0 ? void 0 : _o.notes) || undefined,
                    source: 'whatsapp',
                    language: session.language || 'en',
                    metadata: {
                        sessionId: session.sessionId,
                        conversationId: session.sessionId,
                        // No category stored, only capabilities
                    }
                };
                if (orderType === 'booking') {
                    orderData.bookingDetails = {
                        name: ((_q = (_p = session.userDetails) === null || _p === void 0 ? void 0 : _p.common) === null || _q === void 0 ? void 0 : _q.name) || '',
                        preferredDate: ((_s = (_r = session.userDetails) === null || _r === void 0 ? void 0 : _r.booking) === null || _s === void 0 ? void 0 : _s.preferredDate) || '',
                        preferredTime: ((_u = (_t = session.userDetails) === null || _t === void 0 ? void 0 : _t.booking) === null || _u === void 0 ? void 0 : _u.preferredTime) || '',
                        phone: ((_w = (_v = session.userDetails) === null || _v === void 0 ? void 0 : _v.common) === null || _w === void 0 ? void 0 : _w.phone) || session.userId,
                        serviceType: (_y = (_x = session.userDetails) === null || _x === void 0 ? void 0 : _x.booking) === null || _y === void 0 ? void 0 : _y.serviceType,
                        guestCount: (_0 = (_z = session.userDetails) === null || _z === void 0 ? void 0 : _z.booking) === null || _0 === void 0 ? void 0 : _0.guestCount
                    };
                }
                else {
                    const dd = session.deliveryDetails;
                    orderData.deliveryDetails = {
                        address: (dd === null || dd === void 0 ? void 0 : dd.address) || ((_2 = (_1 = session.userDetails) === null || _1 === void 0 ? void 0 : _1.delivery) === null || _2 === void 0 ? void 0 : _2.address) || ((_3 = session.userDetails) === null || _3 === void 0 ? void 0 : _3.address) || '',
                        contact: (dd === null || dd === void 0 ? void 0 : dd.phone) || session.userId,
                        city: (dd === null || dd === void 0 ? void 0 : dd.city) || ((_5 = (_4 = session.userDetails) === null || _4 === void 0 ? void 0 : _4.delivery) === null || _5 === void 0 ? void 0 : _5.city) || ((_6 = session.userDetails) === null || _6 === void 0 ? void 0 : _6.city) || '',
                        instructions: ((_8 = (_7 = session.userDetails) === null || _7 === void 0 ? void 0 : _7.delivery) === null || _8 === void 0 ? void 0 : _8.specialInstructions) || ((_9 = session.userDetails) === null || _9 === void 0 ? void 0 : _9.notes) || undefined
                    };
                }
                const order = yield Order_1.Order.create(orderData);
                console.log(`[OrderService] Order created successfully: ${order.orderNumber} (ID: ${order._id})`);
                yield CustomerService_1.customerService.updateCustomerMetrics(customer._id.toString(), total);
                yield this.notifyOwner(order, businessContext);
                WhatsAppSessionManager_1.whatsappSessionManager.notifyDashboard(session.businessId, 'refresh-data', { type: orderType, orderId: order._id });
                return order;
            }
            catch (error) {
                console.error(`[OrderService] Error creating order:`, error);
                throw error;
            }
        });
    }
    ;
    getOrderByNumber(orderNumber, businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Order_1.Order.findOne({ orderNumber, businessId }).lean();
        });
    }
    updateOrderStatus(businessId, orderId, newStatus, note, changedByArg) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield Order_1.Order.findById(orderId);
                if (!order) {
                    console.warn(`[OrderService] Order not found: ${orderId}`);
                    return false;
                }
                if (order.businessId.toString() !== businessId) {
                    console.warn(`[OrderService] Business ID mismatch for order ${orderId}`);
                    return false;
                }
                const changedBy = (changedByArg === null || changedByArg === void 0 ? void 0 : changedByArg.name) || 'System';
                const changedById = (changedByArg === null || changedByArg === void 0 ? void 0 : changedByArg.id) === 'system' ? undefined : ((changedByArg === null || changedByArg === void 0 ? void 0 : changedByArg.id) || undefined);
                const changedByType = (changedByArg === null || changedByArg === void 0 ? void 0 : changedByArg.type) || 'System';
                console.log(`[OrderService] Updating order ${order.orderNumber} from ${order.status} to ${newStatus}`);
                console.log(`[OrderService] Note provided: ${note || 'None'}`);
                yield order.updateStatus(newStatus, changedBy, changedById, changedByType, note);
                console.log(`[OrderService] Order ${order.orderNumber} successfully updated to ${newStatus}`);
                // Notify customer about status change
                yield this.notifyCustomer(order, newStatus, note);
                // Notify dashboard to refresh
                WhatsAppSessionManager_1.whatsappSessionManager.notifyDashboard(order.businessId.toString(), 'refresh-data', { type: order.type, orderId: order._id });
                return true;
            }
            catch (error) {
                console.error(`[OrderService] Error updating order status:`, error);
                return false;
            }
        });
    }
    notifyOwner(order, context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ownerPhone = context.contactPhone;
                if (!ownerPhone)
                    return;
                const cleanPhone = String(ownerPhone).replace(/\D/g, "");
                const ownerJid = cleanPhone.includes("@")
                    ? cleanPhone
                    : `${cleanPhone}@s.whatsapp.net`;
                console.log(`[OrderService] Notifying owner for business ${order.businessId} at JID ${ownerJid}`);
                const msgText = TemplateRegistry_1.TemplateRegistry.ownerNewOrder(order);
                yield WhatsAppSessionManager_1.whatsappSessionManager.sendMessage(order.businessId.toString(), ownerJid, { text: msgText });
            }
            catch (error) {
                console.error(`[OrderService] Failed to notify owner:`, error);
            }
        });
    }
    notifyCustomer(order, status, note) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const msg = TemplateRegistry_1.TemplateRegistry.formatOrderStatusUpdate(order, status, note);
                if (!msg) {
                    console.log(`[OrderService] No message generated for status update: ${status}`);
                    return;
                }
                // Get the customer's WhatsApp number - this should be the session.userId stored in customerInfo.phone
                let rawPhone = (_a = order.customerInfo) === null || _a === void 0 ? void 0 : _a.phone;
                // If phone is not in customerInfo, try to get from customer record
                if (!rawPhone && order.customerId) {
                    const customer = yield CustomerService_1.customerService.getCustomerById(order.customerId.toString());
                    rawPhone = customer === null || customer === void 0 ? void 0 : customer.phone;
                }
                if (!rawPhone) {
                    console.warn(`[OrderService] Cannot notify customer: No phone number found for order ${order.orderNumber}`);
                    return;
                }
                // Format the JID properly
                let customerJid;
                if (rawPhone.includes('@')) {
                    // Already a JID
                    customerJid = rawPhone;
                }
                else {
                    // Clean and format as JID
                    const cleanPhone = String(rawPhone).replace(/\D/g, "");
                    customerJid = `${cleanPhone}@s.whatsapp.net`;
                }
                console.log(`[OrderService] Notifying customer ${customerJid} about order ${order.orderNumber} status: ${status}`);
                // Send the message
                const businessId = order.businessId.toString();
                const sent = yield WhatsAppSessionManager_1.whatsappSessionManager.sendMessage(businessId, customerJid, { text: msg });
                if (sent) {
                    console.log(`[OrderService] ✅ Customer notification sent successfully to ${customerJid}`);
                }
                else {
                    console.error(`[OrderService] ❌ Failed to send notification to ${customerJid} - WhatsApp session may not be connected`);
                }
                // Record notification in order
                try {
                    yield order.addNotification('status_update', 'whatsapp', customerJid, 'sent', undefined, undefined, { status, note });
                }
                catch (notifError) {
                    console.error(`[OrderService] Failed to record notification:`, notifError);
                }
            }
            catch (error) {
                console.error(`[OrderService] ❌ Failed to notify customer:`, error);
            }
        });
    }
}
exports.OrderService = OrderService;
exports.orderService = new OrderService();
