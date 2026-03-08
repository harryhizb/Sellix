/**
 * InquiryEngine — lightweight lead capture flow
 * Capability: neither supportsCart nor supportsBooking
 * Collects Name + Phone + Query, saves to Customer, notifies owner.
 */

import { SessionContext, BotState, RuleEngineResponse } from '../types';
import { businessService } from '../BusinessService';
import { customerService } from '../CustomerService';
import { whatsappSessionManager } from '../WhatsAppSessionManager';
import { normalizeInput } from '../normalization';
import { TemplateRegistry } from '../templates/TemplateRegistry';

export class InquiryEngine {
    async handleBrowse(session: SessionContext, context: any): Promise<RuleEngineResponse> {
        const businessName = context.name || context.businessName || 'Us';
        const response = TemplateRegistry.aboutUs(context);
        return { response, newState: BotState.IDLE, updatedSession: session };
    }

    async handleGreeting(session: SessionContext, context: any): Promise<RuleEngineResponse> {
        const businessName = context.name || context.businessName || 'Us';
        const response = {
            text: `👋 *Welcome to ${businessName}!*\n\n` +
                `How can we help you today?\n\n` +
                `Please share your *name, phone number, and query*:\n\n` +
                `Format: _Name, Phone, Your Question_\n\n` +
                `Example:\n_Ahmad Ali, 03001234567, I'd like to know more about your services_`
        };
        return { response, newState: BotState.COLLECTING_DETAILS, updatedSession: session };
    }

    async handleInquiryCollection(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const parts = message.split(',').map((p) => p.trim()).filter((p) => p.length > 0);

        if (parts.length < 2) {
            return {
                response: { text: "We didn't quite catch that. Please provide your Name, Phone, and Query separated by commas.\n\nExample: Ali, 03001234567, Needs info on products." },
                newState: BotState.COLLECTING_DETAILS,
                updatedSession: session
            };
        }

        const [name, phone, ...queryParts] = parts;
        const query = queryParts.join(', ') || 'General inquiry';

        // Save/update customer
        try {
            await customerService.getOrCreateCustomer(session.businessId, session.userId, {
                name, phone, notes: query
            });
        } catch (e) {
            console.error('[InquiryEngine] Failed to save customer:', e);
        }

        // Notify owner
        await this.notifyOwner(context, name, phone, query);

        const response = { text: `✅ Thank you, ${name}!\n\nWe have received your request. Our team will contact you shortly at ${phone}.\n\n_Type MENU to go back._` };

        return { response, newState: BotState.IDLE, updatedSession: session };
    }

    private async notifyOwner(context: any, customerName: string, phone: string, query: string) {
        try {
            const ownerPhone = context.contactPhone || context.phone;
            if (!ownerPhone || !ownerPhone.match(/^\d+$/)) return;

            const dashboardUrl = process.env.DASHBOARD_URL || 'https://yourdashboard.app';
            const msgText = `🔔 *New Inquiry Received!*\n\n*Name:* ${customerName}\n*Phone:* ${phone}\n*Query:* ${query}\n\nCheck dashboard: ${dashboardUrl}`;

            await whatsappSessionManager.sendMessage(context._id?.toString() || '', ownerPhone, { text: msgText });
        } catch (e) {
            console.error('[InquiryEngine] Failed to notify owner:', e);
        }
    }
}
