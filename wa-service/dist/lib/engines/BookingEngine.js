"use strict";
/**
 * BookingEngine — handles service scheduling flows
 * Capability: supportsBooking + supportsServices
 * Creates both an Order (type: 'booking') and an Appointment record.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.BookingEngine = void 0;
const types_1 = require("../types");
const ProductService_1 = require("../ProductService");
const OrderService_1 = require("../OrderService");
const TemplateRegistry_1 = require("../templates/TemplateRegistry");
const normalization_1 = require("../normalization");
const inputParser_1 = require("../utils/inputParser");
class BookingEngine {
    handleBrowse(session, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const services = yield ProductService_1.productService.getServices(session.businessId, { limit: 10 });
            session.lastShownProducts = services;
            const response = TemplateRegistry_1.TemplateRegistry.productList(services, ((_a = context.settings) === null || _a === void 0 ? void 0 : _a.currency) || 'USD');
            return { response, newState: types_1.BotState.BROWSING_PRODUCTS, updatedSession: session };
        });
    }
    handleServiceBrowsing(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const input = (0, normalization_1.normalizeInput)(message);
            if (input.includes('back'))
                return this.handleBrowse(session, context);
            const num = (0, inputParser_1.isListSelection)(input);
            if (num && session.lastShownProducts && session.lastShownProducts[num - 1]) {
                const service = session.lastShownProducts[num - 1];
                session.meta = Object.assign(Object.assign({}, session.meta), { focusingProduct: service });
                session.currentProduct = service;
                // Add to cart as single item
                const cartItem = {
                    productId: (service._id || service.id).toString(),
                    name: service.name,
                    qty: 1,
                    unitPrice: service.price || 0
                };
                session.cart = [cartItem];
                const response = TemplateRegistry_1.TemplateRegistry.serviceFlow(service, ((_a = context.settings) === null || _a === void 0 ? void 0 : _a.currency) || context.currency || 'USD');
                return { response, newState: types_1.BotState.VIEWING_PRODUCT, updatedSession: session };
            }
            return this.handleBrowse(session, context);
        });
    }
    handleViewingService(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = (0, normalization_1.normalizeInput)(message);
            if (input.includes('back'))
                return this.handleBrowse(session, context);
            if (input.includes('book') || input.includes('add') || input.includes('buy') || input === '1') {
                return this.askBookingDetails(session, context);
            }
            return {
                response: `Type *book* to schedule this service, or *back* to return to services.`,
                newState: types_1.BotState.VIEWING_PRODUCT,
                updatedSession: session
            };
        });
    }
    askBookingDetails(session, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = TemplateRegistry_1.TemplateRegistry.askBookingNamePhone();
            return { response, newState: types_1.BotState.COLLECTING_DETAILS, updatedSession: session };
        });
    }
    handleCollectingDetails(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const parts = message.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
            if (parts.length < 4) {
                return { response: TemplateRegistry_1.TemplateRegistry.askBookingNamePhone(), newState: types_1.BotState.COLLECTING_DETAILS, updatedSession: session };
            }
            const [name, preferredDate, preferredTime, phone] = parts;
            session.deliveryDetails = {
                name,
                address: `Booking: ${preferredDate} at ${preferredTime}`,
                city: '',
                phone
            };
            session.userDetails = Object.assign(Object.assign({}, session.userDetails), { name, phone, common: { name, phone }, booking: { preferredDate, preferredTime, serviceType: (_a = session.currentProduct) === null || _a === void 0 ? void 0 : _a.name }, fullDetails: message });
            const serviceName = ((_b = session.currentProduct) === null || _b === void 0 ? void 0 : _b.name) || 'Service';
            const currency = ((_c = context.settings) === null || _c === void 0 ? void 0 : _c.currency) || context.currency || 'USD';
            const response = TemplateRegistry_1.TemplateRegistry.bookingConfirmation({ name, date: preferredDate, time: preferredTime, phone, serviceName }, currency);
            return { response, newState: types_1.BotState.CONFIRMING_ORDER, updatedSession: session };
        });
    }
    processBooking(session, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const dd = session.deliveryDetails;
            if (!(dd === null || dd === void 0 ? void 0 : dd.address) || dd.address.trim().length < 3) {
                return { response: TemplateRegistry_1.TemplateRegistry.askBookingNamePhone(), newState: types_1.BotState.COLLECTING_DETAILS, updatedSession: session };
            }
            const order = yield OrderService_1.orderService.createOrder(session);
            // Also create an Appointment record for the scheduling dashboard
            yield this.createAppointmentRecord(order, session);
            session.cart = [];
            session.deliveryDetails = undefined;
            session.currentProduct = null;
            // Note: For now we reuse orderSuccess as bookingSuccess text is identical
            const response = TemplateRegistry_1.TemplateRegistry.orderSuccess(order.orderNumber, dd.name || 'Customer');
            return { response, newState: types_1.BotState.IDLE, updatedSession: session };
        });
    }
    createAppointmentRecord(order, session) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const { Appointment } = yield Promise.resolve().then(() => __importStar(require('../../models/Appointment')));
                const booking = (_a = session.userDetails) === null || _a === void 0 ? void 0 : _a.booking;
                const dd = session.deliveryDetails;
                const name = (dd === null || dd === void 0 ? void 0 : dd.name) || ((_b = session.userDetails) === null || _b === void 0 ? void 0 : _b.name) || 'Customer';
                const phone = (dd === null || dd === void 0 ? void 0 : dd.phone) || session.userId;
                const preferredDate = (booking === null || booking === void 0 ? void 0 : booking.preferredDate) || '';
                const preferredTime = (booking === null || booking === void 0 ? void 0 : booking.preferredTime) || '';
                // Parse date string
                let appointmentDate = new Date();
                try {
                    appointmentDate = new Date(preferredDate);
                    if (isNaN(appointmentDate.getTime()))
                        appointmentDate = new Date();
                }
                catch ( /* use today */_d) { /* use today */ }
                yield Appointment.create({
                    businessId: order.businessId,
                    customerId: order.customerId,
                    serviceId: undefined,
                    orderId: order._id,
                    customerName: name,
                    customerPhone: phone,
                    serviceName: ((_c = session.currentProduct) === null || _c === void 0 ? void 0 : _c.name) || (booking === null || booking === void 0 ? void 0 : booking.serviceType) || 'Service',
                    date: appointmentDate,
                    time: preferredTime,
                    notes: `Booked via WhatsApp. Order #${order.orderNumber}`,
                    status: 'pending'
                });
                console.log(`[BookingEngine] Appointment created for order ${order.orderNumber}`);
            }
            catch (error) {
                console.error('[BookingEngine] Failed to create appointment record:', error);
                // Non-fatal — order was already saved
            }
        });
    }
    getConfirmationMessage(session, context) {
        var _a, _b, _c, _d, _e;
        const dd = (_a = session.userDetails) === null || _a === void 0 ? void 0 : _a.booking;
        const name = ((_b = session.userDetails) === null || _b === void 0 ? void 0 : _b.name) || 'Customer';
        const phone = ((_c = session.userDetails) === null || _c === void 0 ? void 0 : _c.phone) || '';
        const currency = ((_d = context.settings) === null || _d === void 0 ? void 0 : _d.currency) || context.currency || 'USD';
        return TemplateRegistry_1.TemplateRegistry.bookingConfirmation({ name, date: (dd === null || dd === void 0 ? void 0 : dd.preferredDate) || 'N/A', time: (dd === null || dd === void 0 ? void 0 : dd.preferredTime) || 'N/A', phone, serviceName: ((_e = session.currentProduct) === null || _e === void 0 ? void 0 : _e.name) || 'N/A' }, currency);
    }
}
exports.BookingEngine = BookingEngine;
