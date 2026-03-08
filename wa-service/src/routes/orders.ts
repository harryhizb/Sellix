import { Router, Request, Response } from "express";
import { verifyToken } from "../lib/auth";
import { Order, OrderStatus } from "../models/Order";
import { orderService } from "../lib/OrderService";

const router = Router();

/**
 * GET /api/orders
 * Get all orders for business with optional filtering
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.businessId) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { status, type, limit = "100", skip = "0" } = req.query;

        const filter: any = {
            businessId: decoded.businessId,
            isDeleted: false
        };

        if (status) filter.status = status;
        if (type) filter.type = type;

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string))
            .skip(parseInt(skip as string))
            .lean();

        const total = await Order.countDocuments(filter);

        res.json({
            orders,
            total,
            page: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
            pages: Math.ceil(total / parseInt(limit as string))
        });

    } catch (error: any) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/orders/:id/confirm
 * Confirm a pending order
 */
router.patch("/:id/confirm", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.businessId) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { id } = req.params;
        const { note } = req.body;

        const order = await Order.findOne({ _id: id, businessId: decoded.businessId });

        if (!order) {
            return res.status(404).json({ error: "Order not found or unauthorized" });
        }

        // Replace confirm route logic
        if (order.status !== OrderStatus.PENDING) {
            return res.status(400).json({ error: "Only pending orders can be confirmed" });
        }

        // Use OrderService to update status and send notification
        await orderService.updateOrderStatus(
            decoded.businessId,
            id,
            OrderStatus.CONFIRMED,
            note || 'Order confirmed by owner',
            { id: decoded.userId, name: 'Owner', type: 'User' }
        );

        // Fetch updated order
        const updatedOrder = await Order.findOne({ _id: id, businessId: decoded.businessId });

        res.json({ success: true, order: updatedOrder });

    } catch (error: any) {
        console.error("Error confirming order:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/orders/:id/cancel
 * Cancel an order
 */
router.patch("/:id/cancel", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.businessId) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { id } = req.params;
        const { reason } = req.body;

        const order = await Order.findOne({ _id: id, businessId: decoded.businessId });

        if (!order) {
            return res.status(404).json({ error: "Order not found or unauthorized" });
        }

        // Use OrderService to update status and send notification
        await orderService.updateOrderStatus(
            decoded.businessId,
            id,
            OrderStatus.CANCELLED,
            reason || 'Order cancelled by owner'
        );

        // Fetch updated order
        const updatedOrder = await Order.findOne({ _id: id, businessId: decoded.businessId });

        res.json({ success: true, order: updatedOrder });

    } catch (error: any) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Handle Order Lifecycle / Status Update
 * POST /api/orders/:id/status
 */
router.post("/:id/status", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { id } = req.params;
        const { status, action, note, metadata, trackingNumber, carrier, estimatedDelivery } = req.body;

        console.log(`[Orders API] Status update request for order ${id}`);
        console.log(`[Orders API] Status: ${status}, Action: ${action}, Note: ${note || 'None'}`);

        // Verify order belongs to this business
        const order = await Order.findOne({ _id: id, businessId: decoded.businessId });
        if (!order) return res.status(404).json({ error: "Order not found or unauthorized" });

        // Map action → status
        const actionStatusMap: Record<string, OrderStatus> = {
            approve: OrderStatus.CONFIRMED,
            confirm: OrderStatus.CONFIRMED,
            ship: OrderStatus.SHIPPED,
            complete: OrderStatus.DELIVERED,
            cancel: OrderStatus.CANCELLED,
        };

        const targetStatus: OrderStatus | undefined =
            action ? actionStatusMap[action] :
                status ? (status as OrderStatus) : undefined;

        if (!targetStatus) {
            return res.status(400).json({ error: "Missing status or action in body" });
        }

        // Build comprehensive note from various fields
        let finalNote = note;

        // If shipping with tracking info, add it to the note
        if (targetStatus === OrderStatus.SHIPPED && (trackingNumber || estimatedDelivery)) {
            const trackingParts = [];
            if (trackingNumber) trackingParts.push(`Tracking: ${trackingNumber}`);
            if (carrier) trackingParts.push(`Carrier: ${carrier}`);
            if (estimatedDelivery) trackingParts.push(`Estimated Delivery: ${estimatedDelivery}`);

            finalNote = finalNote
                ? `${finalNote}\n\n${trackingParts.join('\n')}`
                : trackingParts.join('\n');
        }

        // Single call: update status AND notify customer via WA
        const success = await orderService.updateOrderStatus(
            decoded.businessId,
            id,
            targetStatus,
            finalNote || `Status updated to ${targetStatus}`,
            decoded.userId ? { id: decoded.userId, name: 'Owner', type: 'User' } : undefined
        );

        if (!success) {
            return res.status(500).json({ error: "Failed to update order status" });
        }

        // Update metadata if provided
        if (metadata || trackingNumber || carrier || estimatedDelivery) {
            const updateData: any = {};
            if (metadata) updateData.metadata = metadata;
            if (trackingNumber || carrier || estimatedDelivery) {
                updateData.deliveryTracking = {
                    ...(order.deliveryTracking || {}),
                    ...(trackingNumber && { trackingNumber }),
                    ...(carrier && { carrier }),
                    ...(estimatedDelivery && { estimatedDelivery: new Date(estimatedDelivery) })
                };
            }
            await Order.findByIdAndUpdate(id, { $set: updateData });
        }

        const updatedOrder = await Order.findOne({ _id: id, businessId: decoded.businessId });
        console.log(`[Orders API] Order ${id} status updated successfully to ${targetStatus}`);
        return res.json({ success: true, order: updatedOrder });

    } catch (error: any) {
        console.error("[Orders API] Error updating order status:", error);
        res.status(500).json({ error: error.message });
    }
});

export const ordersRouter = router;
