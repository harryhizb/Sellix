import { SessionContext } from './types';
import { calculateSubtotal, calculateCartDiscount } from './utils/discountUtils';
import { calculateTotal } from './utils/cartUtils';
import { businessService } from './BusinessService';
import { customerService } from './CustomerService';
import { whatsappSessionManager } from './WhatsAppSessionManager';
import { Order } from '../models/Order';
import { connectDB } from '../config/db';
import { TemplateRegistry } from './templates/TemplateRegistry';
import mongoose from 'mongoose';

export class OrderService {
    async createOrder(session: SessionContext): Promise<any> {
        try {
            await connectDB();

            if (!session.cart || session.cart.length === 0) {
                throw new Error('Cannot create order: Cart is empty');
            }
            if (!session.businessId) {
                throw new Error('Cannot create order: Missing businessId');
            }

            console.log(`[OrderService] Creating order for user ${session.userId}, cart items: ${session.cart.length}`);

            const businessContext = await businessService.getBusinessContext(session.businessId);
            const currency = businessContext?.settings?.currency || 'PKR';
            const deliveryFee = businessContext?.settings?.deliveryFee || 0;
            const caps = businessContext?.capabilities || {};

            // Determine order type based on capabilities
            let orderType = 'order';
            if (caps.supportsBooking) {
                orderType = 'booking';
            } else if (caps.supportsInformation) {
                // Institutes might not create orders, but if they do, treat as 'enrollment'
                orderType = 'enrollment';
            }

            const subtotal = calculateSubtotal(session.cart);
            const discountAmount = calculateCartDiscount(session.cart);
            const total = orderType === 'order'
                ? Math.round((calculateTotal(session.cart) + deliveryFee) * 100) / 100
                : Math.round(calculateTotal(session.cart) * 100) / 100;

            console.log(`[OrderService] Type: ${orderType}, Totals - Subtotal: ${subtotal}, Discount: ${discountAmount}, Delivery: ${deliveryFee}, Total: ${total}`);

            const customer = await customerService.getOrCreateCustomer(
                session.businessId,
                session.userId,
                session.userDetails
            );
            if (!customer) throw new Error('Failed to create/retrieve customer');

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

            const orderData: any = {
                businessId: new mongoose.Types.ObjectId(session.businessId),
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
                    name: (session.deliveryDetails as any)?.name || session.userDetails?.common?.name || session.userDetails?.name || customer.name || '',
                    phone: session.userId, // Always use the actual WhatsApp number (session.userId)
                    altPhone: (session.deliveryDetails as any)?.phone || undefined, // Store delivery phone separately if different
                    email: session.userDetails?.common?.email || session.userDetails?.email || customer.email || undefined
                },
                specialInstructions: session.userDetails?.delivery?.specialInstructions || session.userDetails?.notes || undefined,
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
                    name: session.userDetails?.common?.name || '',
                    preferredDate: session.userDetails?.booking?.preferredDate || '',
                    preferredTime: session.userDetails?.booking?.preferredTime || '',
                    phone: session.userDetails?.common?.phone || session.userId,
                    serviceType: session.userDetails?.booking?.serviceType,
                    guestCount: session.userDetails?.booking?.guestCount
                };
            } else {
                const dd = session.deliveryDetails as any;
                orderData.deliveryDetails = {
                    address: dd?.address || session.userDetails?.delivery?.address || session.userDetails?.address || '',
                    contact: dd?.phone || session.userId,
                    city: dd?.city || session.userDetails?.delivery?.city || session.userDetails?.city || '',
                    instructions: session.userDetails?.delivery?.specialInstructions || session.userDetails?.notes || undefined
                };
            }

            const order = await Order.create(orderData);
            console.log(`[OrderService] Order created successfully: ${order.orderNumber} (ID: ${order._id})`);

            await customerService.updateCustomerMetrics(customer._id.toString(), total);
            await this.notifyOwner(order, businessContext);
            whatsappSessionManager.notifyDashboard(session.businessId, 'refresh-data', { type: orderType, orderId: order._id });

            return order;

        } catch (error) {
            console.error(`[OrderService] Error creating order:`, error);
            throw error;
        }
    };
    async getOrderByNumber(orderNumber: string, businessId: string): Promise<any> {
        return await Order.findOne({ orderNumber, businessId }).lean();
    }

    async updateOrderStatus(
        businessId: string,
        orderId: string,
        newStatus: string,
        note?: string,
        changedByArg?: { id: string, name: string, type: 'Customer' | 'User' | 'System' }
    ): Promise<boolean> {
        try {
            const order = await Order.findById(orderId);
            if (!order) {
                console.warn(`[OrderService] Order not found: ${orderId}`);
                return false;
            }
            if (order.businessId.toString() !== businessId) {
                console.warn(`[OrderService] Business ID mismatch for order ${orderId}`);
                return false;
            }

            const changedBy = changedByArg?.name || 'System';
            const changedById = changedByArg?.id === 'system' ? undefined : (changedByArg?.id || undefined);
            const changedByType = changedByArg?.type || 'System';

            console.log(`[OrderService] Updating order ${order.orderNumber} from ${order.status} to ${newStatus}`);
            console.log(`[OrderService] Note provided: ${note || 'None'}`);

            await (order as any).updateStatus(
                newStatus,
                changedBy,
                changedById,
                changedByType,
                note
            );

            console.log(`[OrderService] Order ${order.orderNumber} successfully updated to ${newStatus}`);

            // Notify customer about status change
            await this.notifyCustomer(order, newStatus, note);

            // Notify dashboard to refresh
            whatsappSessionManager.notifyDashboard(order.businessId.toString(), 'refresh-data', { type: order.type, orderId: order._id });

            return true;
        } catch (error) {
            console.error(`[OrderService] Error updating order status:`, error);
            return false;
        }
    }

    private async notifyOwner(order: any, context: any) {
        try {
            const ownerPhone = context.contactPhone;
            if (!ownerPhone) return;

            const cleanPhone = String(ownerPhone).replace(/\D/g, "");
            const ownerJid = cleanPhone.includes("@")
                ? cleanPhone
                : `${cleanPhone}@s.whatsapp.net`;
            console.log(`[OrderService] Notifying owner for business ${order.businessId} at JID ${ownerJid}`);
            const msgText = TemplateRegistry.ownerNewOrder(order);
            await whatsappSessionManager.sendMessage(order.businessId.toString(), ownerJid, { text: msgText });
        } catch (error) {
            console.error(`[OrderService] Failed to notify owner:`, error);
        }
    }

    private async notifyCustomer(order: any, status: string, note?: string) {
        try {
            const msg = TemplateRegistry.formatOrderStatusUpdate(order, status, note);
            if (!msg) {
                console.log(`[OrderService] No message generated for status update: ${status}`);
                return;
            }

            // Get the customer's WhatsApp number - this should be the session.userId stored in customerInfo.phone
            let rawPhone = order.customerInfo?.phone;

            // If phone is not in customerInfo, try to get from customer record
            if (!rawPhone && order.customerId) {
                const customer = await customerService.getCustomerById(order.customerId.toString());
                rawPhone = customer?.phone;
            }

            if (!rawPhone) {
                console.warn(`[OrderService] Cannot notify customer: No phone number found for order ${order.orderNumber}`);
                return;
            }

            // Format the JID properly
            let customerJid: string;
            if (rawPhone.includes('@')) {
                // Already a JID
                customerJid = rawPhone;
            } else {
                // Clean and format as JID
                const cleanPhone = String(rawPhone).replace(/\D/g, "");
                customerJid = `${cleanPhone}@s.whatsapp.net`;
            }

            console.log(`[OrderService] Notifying customer ${customerJid} about order ${order.orderNumber} status: ${status}`);

            // Send the message
            const businessId = order.businessId.toString();
            const sent = await whatsappSessionManager.sendMessage(businessId, customerJid, { text: msg });

            if (sent) {
                console.log(`[OrderService] ✅ Customer notification sent successfully to ${customerJid}`);
            } else {
                console.error(`[OrderService] ❌ Failed to send notification to ${customerJid} - WhatsApp session may not be connected`);
            }

            // Record notification in order
            try {
                await (order as any).addNotification(
                    'status_update',
                    'whatsapp',
                    customerJid,
                    'sent',
                    undefined,
                    undefined,
                    { status, note }
                );
            } catch (notifError) {
                console.error(`[OrderService] Failed to record notification:`, notifError);
            }

        } catch (error) {
            console.error(`[OrderService] ❌ Failed to notify customer:`, error);
        }
    }
}

export const orderService = new OrderService();
