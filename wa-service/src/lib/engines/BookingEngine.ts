/**
 * BookingEngine — handles service scheduling flows
 * Capability: supportsBooking + supportsServices
 * Creates both an Order (type: 'booking') and an Appointment record.
 */

import { SessionContext, BotState, RuleEngineResponse, CartItem } from '../types';
import { productService } from '../ProductService';
import { orderService } from '../OrderService';
import { TemplateRegistry } from '../templates/TemplateRegistry';
import { normalizeInput } from '../normalization';
import { isListSelection } from '../utils/inputParser';

export class BookingEngine {
  async handleBrowse(session: SessionContext, context: any): Promise<RuleEngineResponse> {
    const services = await productService.getServices(session.businessId, { limit: 10 });
    session.lastShownProducts = services;

    const response = TemplateRegistry.productList(services, context.settings?.currency || 'USD');
    return { response, newState: BotState.BROWSING_PRODUCTS, updatedSession: session };
}

    async handleServiceBrowsing(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const input = normalizeInput(message);
        if (input.includes('back')) return this.handleBrowse(session, context);

        const num = isListSelection(input);
        if (num && session.lastShownProducts && session.lastShownProducts[num - 1]) {
            const service = session.lastShownProducts[num - 1];
            session.meta = { ...session.meta, focusingProduct: service };
            session.currentProduct = service;

            // Add to cart as single item
            const cartItem: CartItem = {
                productId: ((service as any)._id || (service as any).id).toString(),
                name: service.name,
                qty: 1,
                unitPrice: service.price || 0
            };
            session.cart = [cartItem];

            const response = TemplateRegistry.serviceFlow(service, context.settings?.currency || context.currency || 'USD');
            return { response, newState: BotState.VIEWING_PRODUCT, updatedSession: session };
        }

        return this.handleBrowse(session, context);
    }

    async handleViewingService(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const input = normalizeInput(message);
        if (input.includes('back')) return this.handleBrowse(session, context);

        if (input.includes('book') || input.includes('add') || input.includes('buy') || input === '1') {
            return this.askBookingDetails(session, context);
        }

        return {
            response: `Type *book* to schedule this service, or *back* to return to services.`,
            newState: BotState.VIEWING_PRODUCT,
            updatedSession: session
        };
    }

    async askBookingDetails(session: SessionContext, context: any): Promise<RuleEngineResponse> {
        const response = TemplateRegistry.askBookingNamePhone();
        return { response, newState: BotState.COLLECTING_DETAILS, updatedSession: session };
    }

    async handleCollectingDetails(session: SessionContext, message: string, context: any): Promise<RuleEngineResponse> {
        const parts = message.split(',').map((p) => p.trim()).filter((p) => p.length > 0);

        if (parts.length < 4) {
            return { response: TemplateRegistry.askBookingNamePhone(), newState: BotState.COLLECTING_DETAILS, updatedSession: session };
        }

        const [name, preferredDate, preferredTime, phone] = parts;

        session.deliveryDetails = {
            name,
            address: `Booking: ${preferredDate} at ${preferredTime}`,
            city: '',
            phone
        };
        session.userDetails = {
            ...session.userDetails,
            name, phone,
            common: { name, phone },
            booking: { preferredDate, preferredTime, serviceType: session.currentProduct?.name },
            fullDetails: message
        };

        const serviceName = session.currentProduct?.name || 'Service';
        const currency = context.settings?.currency || context.currency || 'USD';
        const response = TemplateRegistry.bookingConfirmation({ name, date: preferredDate, time: preferredTime, phone, serviceName }, currency);

        return { response, newState: BotState.CONFIRMING_ORDER, updatedSession: session };
    }

    async processBooking(session: SessionContext, context: any): Promise<RuleEngineResponse> {
        const dd = session.deliveryDetails as any;
        if (!dd?.address || dd.address.trim().length < 3) {
            return { response: TemplateRegistry.askBookingNamePhone(), newState: BotState.COLLECTING_DETAILS, updatedSession: session };
        }

        const order = await orderService.createOrder(session);

        // Also create an Appointment record for the scheduling dashboard
        await this.createAppointmentRecord(order, session);

        session.cart = [];
        session.deliveryDetails = undefined;
        session.currentProduct = null;

        // Note: For now we reuse orderSuccess as bookingSuccess text is identical
        const response = TemplateRegistry.orderSuccess(order.orderNumber, dd.name || 'Customer');

        return { response, newState: BotState.IDLE, updatedSession: session };
    }

    private async createAppointmentRecord(order: any, session: SessionContext) {
        try {
            const { Appointment } = await import('../../models/Appointment');
            const booking = session.userDetails?.booking;
            const dd = session.deliveryDetails as any;
            const name = dd?.name || session.userDetails?.name || 'Customer';
            const phone = dd?.phone || session.userId;
            const preferredDate = booking?.preferredDate || '';
            const preferredTime = booking?.preferredTime || '';

            // Parse date string
            let appointmentDate = new Date();
            try {
                appointmentDate = new Date(preferredDate);
                if (isNaN(appointmentDate.getTime())) appointmentDate = new Date();
            } catch { /* use today */ }

            await Appointment.create({
                businessId: order.businessId,
                customerId: order.customerId,
                serviceId: undefined,
                orderId: order._id,
                customerName: name,
                customerPhone: phone,
                serviceName: session.currentProduct?.name || booking?.serviceType || 'Service',
                date: appointmentDate,
                time: preferredTime,
                notes: `Booked via WhatsApp. Order #${order.orderNumber}`,
                status: 'pending'
            });
            console.log(`[BookingEngine] Appointment created for order ${order.orderNumber}`);
        } catch (error) {
            console.error('[BookingEngine] Failed to create appointment record:', error);
            // Non-fatal — order was already saved
        }
    }

    getConfirmationMessage(session: SessionContext, context: any): any {
        const dd = session.userDetails?.booking;
        const name = session.userDetails?.name || 'Customer';
        const phone = session.userDetails?.phone || '';
        const currency = context.settings?.currency || context.currency || 'USD';
        return TemplateRegistry.bookingConfirmation({ name, date: dd?.preferredDate || 'N/A', time: dd?.preferredTime || 'N/A', phone, serviceName: session.currentProduct?.name || 'N/A' }, currency);
    }
}
