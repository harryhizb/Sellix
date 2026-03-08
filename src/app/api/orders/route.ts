import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Order, OrderStatus } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { User } from "@/models/User";
import { ConversationOverride } from "@/models/ConversationOverride";

const orderItemSchema = z.object({
    productId: z.string().optional(),
    name: z.string().min(1),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
    variant: z.string().optional()
});

const createOrderSchema = z.object({
    customerId: z.string().min(1),
    items: z.array(orderItemSchema).min(1),
    currency: z.string().optional().default("USD"),
    paymentMethod: z.string().optional().default("COD"),
    deliveryDetails: z.string().optional(),
    customerInfo: z.any().optional(),
    notes: z.string().optional(),
    source: z.string().optional().default("web"),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional()
});

export async function GET(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        await dbConnect();

        // Ensure models are registered (Next.js edge case)
        if (!Customer || !Order || !User) {
            throw new Error("Models not properly registered");
        }
        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const customerId = searchParams.get("customerId");
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Build query
        const query: any = { businessId: user.businessId, isDeleted: false };
        console.log(`[Orders GET] User Email: ${user.email} | Target Business ID: ${user.businessId}`);

        if (status && status !== "all") {
            query.status = status;
        }

        // NEW: Filter by type
        if (type && (type === 'order' || type === 'booking')) {
            query.type = type;
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
            businessId: user.businessId,
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
            { $match: { businessId: user.businessId, isDeleted: false } },
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

        return NextResponse.json({
            orders: ordersWithDetails || [],
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            statistics
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ orders: [] }, { status: 500 });
    }
}

// Helper function to generate order summary
function generateOrderSummary(order: any, language: string): string {
    const items = order.items.map((item: any, index: number) => {
        return `${index + 1}. ${item.name} (${item.quantity} x ${order.currency} ${item.price}) = ${order.currency} ${item.quantity * item.price}`;
    }).join('\n');

    return `Order #${order.orderNumber}\nStatus: ${order.status.toUpperCase()}\n\nItems:\n${items}\n\nTotal: ${order.currency} ${order.totalAmount}`;
}

// POST endpoint to create a new order (for testing/manual creation)
export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const body = await req.json();

        // Validate request body
        const validation = createOrderSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid order data",
                details: validation.error.issues
            }, { status: 400 });
        }

        await dbConnect();

        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Validate required fields
        if (!body.customerId || !body.items || !body.items.length) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Calculate totals
        const subtotal = body.items.reduce((sum: number, item: any) =>
            sum + (item.price * item.quantity), 0);
        const taxAmount = subtotal * 0.15; // 15% tax for example
        const totalAmount = subtotal + taxAmount;

        const order = await Order.create({
            businessId: user.businessId,
            customerId: body.customerId,
            items: body.items,
            subtotal,
            taxAmount,
            totalAmount,
            currency: body.currency || "USD",
            status: OrderStatus.PENDING,
            paymentMethod: body.paymentMethod || "COD",
            deliveryDetails: body.deliveryDetails,
            customerInfo: body.customerInfo,
            notes: body.notes,
            metadata: {
                source: body.source || "web",
                ipAddress: body.ipAddress,
                userAgent: body.userAgent
            }
        });

        // Notify dashboard
        // This would typically call a webhook or service
        console.log(`New order created: ${order._id}`);

        return NextResponse.json({ order }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating order:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}