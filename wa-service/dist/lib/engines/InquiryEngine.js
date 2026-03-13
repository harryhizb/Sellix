"use strict";
/**
 * InquiryEngine — lightweight lead capture flow
 * Capability: neither supportsCart nor supportsBooking
 * Collects Name + Phone + Query, saves to Customer, notifies owner.
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
exports.InquiryEngine = void 0;
const types_1 = require("../types");
const CustomerService_1 = require("../CustomerService");
const WhatsAppSessionManager_1 = require("../WhatsAppSessionManager");
const TemplateRegistry_1 = require("../templates/TemplateRegistry");
class InquiryEngine {
    handleBrowse(session, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const businessName = context.name || context.businessName || 'Us';
            const response = TemplateRegistry_1.TemplateRegistry.aboutUs(context);
            return { response, newState: types_1.BotState.IDLE, updatedSession: session };
        });
    }
    handleGreeting(session, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const businessName = context.name || context.businessName || 'Us';
            const response = {
                text: `👋 *Welcome to ${businessName}!*\n\n` +
                    `How can we help you today?\n\n` +
                    `Please share your *name, phone number, and query*:\n\n` +
                    `Format: _Name, Phone, Your Question_\n\n` +
                    `Example:\n_Ahmad Ali, 03001234567, I'd like to know more about your services_`
            };
            return { response, newState: types_1.BotState.COLLECTING_DETAILS, updatedSession: session };
        });
    }
    handleInquiryCollection(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const parts = message.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
            if (parts.length < 2) {
                return {
                    response: { text: "We didn't quite catch that. Please provide your Name, Phone, and Query separated by commas.\n\nExample: Ali, 03001234567, Needs info on products." },
                    newState: types_1.BotState.COLLECTING_DETAILS,
                    updatedSession: session
                };
            }
            const [name, phone, ...queryParts] = parts;
            const query = queryParts.join(', ') || 'General inquiry';
            // Save/update customer
            try {
                yield CustomerService_1.customerService.getOrCreateCustomer(session.businessId, session.userId, {
                    name, phone, notes: query
                });
            }
            catch (e) {
                console.error('[InquiryEngine] Failed to save customer:', e);
            }
            // Notify owner
            yield this.notifyOwner(context, name, phone, query);
            const response = { text: `✅ Thank you, ${name}!\n\nWe have received your request. Our team will contact you shortly at ${phone}.\n\n_Type MENU to go back._` };
            return { response, newState: types_1.BotState.IDLE, updatedSession: session };
        });
    }
    notifyOwner(context, customerName, phone, query) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const ownerPhone = context.contactPhone || context.phone;
                if (!ownerPhone || !ownerPhone.match(/^\d+$/))
                    return;
                const dashboardUrl = process.env.DASHBOARD_URL || 'https://yourdashboard.app';
                const msgText = `🔔 *New Inquiry Received!*\n\n*Name:* ${customerName}\n*Phone:* ${phone}\n*Query:* ${query}\n\nCheck dashboard: ${dashboardUrl}`;
                yield WhatsAppSessionManager_1.whatsappSessionManager.sendMessage(((_a = context._id) === null || _a === void 0 ? void 0 : _a.toString()) || '', ownerPhone, { text: msgText });
            }
            catch (e) {
                console.error('[InquiryEngine] Failed to notify owner:', e);
            }
        });
    }
}
exports.InquiryEngine = InquiryEngine;
