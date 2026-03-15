import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Order, OrderStatus } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { User } from "@/models/User";
import { ConversationOverride } from "@/models/ConversationOverride";

interface GetOrdersParams {
    businessId: string;
    status?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    customerId?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
}

export async function getOrdersData(params: GetOrdersParams) {
    const {
        businessId,
        status,
        type,
        startDate,
        endDate,
        customerId,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 20
    } = params;

    const skip = (page - 1) * limit;

    await dbConnect();
    
    // Convert businessId string to ObjectId for specific operations
    const bId = typeof businessId === 'string' ? new mongoose.Types.ObjectId(businessId) : businessId;

    // Ensure models are registered (Next.js edge case)
    if (!Customer || !Order || !User) {
        throw new Error("Models not properly registered");
    }

    // Build query
    const query: any = { businessId: bId, isDeleted: false };

    if (status && status !== "all") {
        // Handle case-sensitivity (some parts of dashboard use PENDING, DB uses pending)
        query.status = { $regex: new RegExp(`^${status}$`, 'i') };
    }

    if (type && (type === 'order' || type === 'booking')) {
        query.type = { $regex: new RegExp(`^${type}$`, 'i') };
    }

    if (customerId) {
        query.customerId = customerId;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            query.createdAt.$lte = new Date(endDate);
        }
    }

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    // Get orders with pagination and populate
    const orders = await Order.find(query)
        .populate("customerId", "name phone email")
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Fetch overrides for these customers
    const customerIds = orders.map(o => o.customerId?._id).filter(Boolean);
    const overrides = await ConversationOverride.find({
        businessId,
        customerId: { $in: customerIds },
        isActive: true
    });

    // Map overrides to orders and add summary
    const ordersWithDetails = orders.map(order => {
        const override = overrides.find(ov =>
            ov.customerId?.toString() === order.customerId?._id?.toString()
        );

        // Generate professional summary
        const summary = generateOrderSummary(order, 'en');

        return {
            ...order,
            isPaused: !!override?.ownerTookOver,
            summary,
            formattedOrderNumber: `ORD-${order.orderNumber?.slice(-6) || order._id.toString().slice(-6)}`
        };
    });

    // Get statistics
    const stats = await Order.aggregate([
        { $match: { businessId: bId, isDeleted: false } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' }
            }
        }
    ]);

    const statistics = {
        total: stats.reduce((sum, stat) => sum + stat.count, 0),
        pending: stats.find(s => s._id === OrderStatus.PENDING)?.count || 0,
        confirmed: stats.find(s => s._id === OrderStatus.CONFIRMED)?.count || 0,
        processing: stats.find(s => s._id === OrderStatus.PROCESSING)?.count || 0,
        shipped: stats.find(s => s._id === OrderStatus.SHIPPED)?.count || 0,
        delivered: stats.find(s => s._id === OrderStatus.DELIVERED)?.count || 0,
        totalRevenue: stats.reduce((sum, stat) => sum + stat.totalRevenue, 0)
    };

    return {
        orders: ordersWithDetails || [],
        pagination: { 
            page, 
            limit, 
            total, 
            totalPages: Math.ceil(total / limit) 
        },
        statistics
    };
}

// Helper function to generate order summary
function generateOrderSummary(order: any, language: string): string {
    const items = order.items.map((item: any, index: number) => {
        return `${index + 1}. ${item.name} (${item.quantity} x ${order.currency} ${item.price}) = ${order.currency} ${item.quantity * item.price}`;
    }).join('\n');

    return `Order #${order.orderNumber}\nStatus: ${order.status.toUpperCase()}\n\nItems:\n${items}\n\nTotal: ${order.currency} ${order.totalAmount}`;
}
