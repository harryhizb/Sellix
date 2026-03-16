import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Order, OrderStatus } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { User } from "@/models/User";
import { ConversationOverride } from "@/models/ConversationOverride";
import { getOrdersData } from "@/lib/services/order-service";

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
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as any;
    if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    try {
        await dbConnect();

        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const params = {
            businessId: user.businessId.toString(),
            status: searchParams.get("status") || undefined,
            type: searchParams.get("type") || undefined,
            startDate: searchParams.get("startDate") || undefined,
            endDate: searchParams.get("endDate") || undefined,
            customerId: searchParams.get("customerId") || undefined,
            sortBy: searchParams.get("sortBy") || "createdAt",
            sortOrder: searchParams.get("sortOrder") || "desc",
            page: parseInt(searchParams.get("page") || "1"),
            limit: parseInt(searchParams.get("limit") || "20")
        };

        const result = await getOrdersData(params);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ orders: [] }, { status: 500 });
    }
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