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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../lib/auth");
const Order_1 = require("../models/Order");
const OrderService_1 = require("../lib/OrderService");
const router = (0, express_1.Router)();
/**
 * GET /api/orders
 * Get all orders for business with optional filtering
 */
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded || !decoded.businessId) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { status, type, limit = "100", skip = "0" } = req.query;
        const filter = {
            businessId: decoded.businessId,
            isDeleted: false
        };
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        const orders = yield Order_1.Order.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();
        const total = yield Order_1.Order.countDocuments(filter);
        res.json({
            orders,
            total,
            page: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
            pages: Math.ceil(total / parseInt(limit))
        });
    }
    catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * PATCH /api/orders/:id/confirm
 * Confirm a pending order
 */
router.patch("/:id/confirm", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded || !decoded.businessId) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { id } = req.params;
        const { note } = req.body;
        const order = yield Order_1.Order.findOne({ _id: id, businessId: decoded.businessId });
        if (!order) {
            return res.status(404).json({ error: "Order not found or unauthorized" });
        }
        // Replace confirm route logic
        if (order.status !== Order_1.OrderStatus.PENDING) {
            return res.status(400).json({ error: "Only pending orders can be confirmed" });
        }
        // Use OrderService to update status and send notification
        yield OrderService_1.orderService.updateOrderStatus(decoded.businessId, id, Order_1.OrderStatus.CONFIRMED, note || 'Order confirmed by owner', { id: decoded.userId, name: 'Owner', type: 'User' });
        // Fetch updated order
        const updatedOrder = yield Order_1.Order.findOne({ _id: id, businessId: decoded.businessId });
        res.json({ success: true, order: updatedOrder });
    }
    catch (error) {
        console.error("Error confirming order:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * PATCH /api/orders/:id/cancel
 * Cancel an order
 */
router.patch("/:id/cancel", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded || !decoded.businessId) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { id } = req.params;
        const { reason } = req.body;
        const order = yield Order_1.Order.findOne({ _id: id, businessId: decoded.businessId });
        if (!order) {
            return res.status(404).json({ error: "Order not found or unauthorized" });
        }
        // Use OrderService to update status and send notification
        yield OrderService_1.orderService.updateOrderStatus(decoded.businessId, id, Order_1.OrderStatus.CANCELLED, reason || 'Order cancelled by owner');
        // Fetch updated order
        const updatedOrder = yield Order_1.Order.findOne({ _id: id, businessId: decoded.businessId });
        res.json({ success: true, order: updatedOrder });
    }
    catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * Handle Order Lifecycle / Status Update
 * POST /api/orders/:id/status
 */
router.post("/:id/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { id } = req.params;
        const { status, action, note, metadata, trackingNumber, carrier, estimatedDelivery } = req.body;
        console.log(`[Orders API] Status update request for order ${id}`);
        console.log(`[Orders API] Status: ${status}, Action: ${action}, Note: ${note || 'None'}`);
        // Verify order belongs to this business
        const order = yield Order_1.Order.findOne({ _id: id, businessId: decoded.businessId });
        if (!order)
            return res.status(404).json({ error: "Order not found or unauthorized" });
        // Map action → status
        const actionStatusMap = {
            approve: Order_1.OrderStatus.CONFIRMED,
            confirm: Order_1.OrderStatus.CONFIRMED,
            ship: Order_1.OrderStatus.SHIPPED,
            complete: Order_1.OrderStatus.DELIVERED,
            cancel: Order_1.OrderStatus.CANCELLED,
        };
        const targetStatus = action ? actionStatusMap[action] :
            status ? status : undefined;
        if (!targetStatus) {
            return res.status(400).json({ error: "Missing status or action in body" });
        }
        // Build comprehensive note from various fields
        let finalNote = note;
        // If shipping with tracking info, add it to the note
        if (targetStatus === Order_1.OrderStatus.SHIPPED && (trackingNumber || estimatedDelivery)) {
            const trackingParts = [];
            if (trackingNumber)
                trackingParts.push(`Tracking: ${trackingNumber}`);
            if (carrier)
                trackingParts.push(`Carrier: ${carrier}`);
            if (estimatedDelivery)
                trackingParts.push(`Estimated Delivery: ${estimatedDelivery}`);
            finalNote = finalNote
                ? `${finalNote}\n\n${trackingParts.join('\n')}`
                : trackingParts.join('\n');
        }
        // Single call: update status AND notify customer via WA
        const success = yield OrderService_1.orderService.updateOrderStatus(decoded.businessId, id, targetStatus, finalNote || `Status updated to ${targetStatus}`, decoded.userId ? { id: decoded.userId, name: 'Owner', type: 'User' } : undefined);
        if (!success) {
            return res.status(500).json({ error: "Failed to update order status" });
        }
        // Update metadata if provided
        if (metadata || trackingNumber || carrier || estimatedDelivery) {
            const updateData = {};
            if (metadata)
                updateData.metadata = metadata;
            if (trackingNumber || carrier || estimatedDelivery) {
                updateData.deliveryTracking = Object.assign(Object.assign(Object.assign(Object.assign({}, (order.deliveryTracking || {})), (trackingNumber && { trackingNumber })), (carrier && { carrier })), (estimatedDelivery && { estimatedDelivery: new Date(estimatedDelivery) }));
            }
            yield Order_1.Order.findByIdAndUpdate(id, { $set: updateData });
        }
        const updatedOrder = yield Order_1.Order.findOne({ _id: id, businessId: decoded.businessId });
        console.log(`[Orders API] Order ${id} status updated successfully to ${targetStatus}`);
        return res.json({ success: true, order: updatedOrder });
    }
    catch (error) {
        console.error("[Orders API] Error updating order status:", error);
        res.status(500).json({ error: error.message });
    }
}));
exports.ordersRouter = router;
