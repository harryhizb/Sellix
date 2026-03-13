import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Business } from "@/models/Business";
import { Product } from "@/models/Product";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import mongoose from "mongoose";

const cartItemSchema = z.object({
    productId: z.string().optional(),
    name: z.string().min(1),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
    variant: z.string().optional(),
});

const webOrderSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(7, "Valid phone number required"),
    address: z.string().min(5, "Address is required"),
    city: z.string().min(1, "City is required"),
    paymentMethod: z.enum(["COD", "online", "bank_transfer"]).default("COD"),
    items: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
    notes: z.string().optional(),
});

export async function POST(
    req: Request,
    { params }: { params: { slug: string } }
) {
    try {
        await dbConnect();

        // Lookup business by slug
        const business = await Business.findOne({ slug: params.slug }).lean() as any;
        if (!business) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const body = await req.json();
        const validation = webOrderSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid order data", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { name, phone, address, city, paymentMethod, items, notes } = validation.data;

        // Normalize phone
        const cleanPhone = phone.replace(/\D/g, "");

        // Get or create customer
        let customer = await Customer.findOne({
            phone: cleanPhone,
            businessId: business._id,
        });

        if (!customer) {
            customer = await Customer.create({
                phone: cleanPhone,
                name,
                businessId: business._id,
                state: {
                    step: "INITIAL",
                    data: new Map(),
                    fallbackCount: 0,
                    detectedLanguage: "en",
                },
                metadata: new Map(),
            });
        } else if (!customer.name && name) {
            customer.name = name;
            await customer.save();
        }

        // Calculate totals
        const currency = business.settings?.currency || "PKR";
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalAmount = subtotal;

        // Build order items
        const orderItems = items.map((item) => ({
            productId: item.productId ? new mongoose.Types.ObjectId(item.productId) : undefined,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            ...(item.variant ? { attributes: { variant: item.variant } } : {}),
        }));

        // Create order
        const order = await Order.create({
            businessId: new mongoose.Types.ObjectId(business._id),
            customerId: customer._id,
            type: "order",
            items: orderItems,
            subtotal,
            discountAmount: 0,
            deliveryFee: 0,
            totalAmount,
            currency,
            status: "pending",
            paymentMethod,
            source: "web",
            customerInfo: {
                name,
                phone: cleanPhone,
            },
            deliveryDetails: {
                address,
                contact: cleanPhone,
                city,
                instructions: notes || undefined,
            },
            notes: notes || undefined,
            metadata: {
                businessCategory: business.category,
            },
        });

        // ── WhatsApp Notifications (fire-and-forget) ──────────────────────────
        const waServiceUrl = process.env.WA_SERVICE_URL || "http://localhost:3001";
        const internalSecret = process.env.INTERNAL_SERVICE_SECRET || "";
        const businessId = business._id.toString();

        const storeName = business.storefront?.storeName || business.name;
        const customerMsg = buildCustomerConfirmation(order, currency, storeName, params.slug);
        const ownerMsg = buildOwnerNotification(order, business, currency);

        const customerJid = `${cleanPhone}@s.whatsapp.net`;
        const ownerPhone = (business.contactPhone || "").replace(/\D/g, "");
        const ownerJid = ownerPhone ? `${ownerPhone}@s.whatsapp.net` : null;

        // Notify customer
        sendWANotification(waServiceUrl, internalSecret, businessId, customerJid, customerMsg).catch(
            (e) => console.error("[Store Order] Failed to notify customer via WA:", e.message)
        );

        // Notify owner
        if (ownerJid) {
            sendWANotification(waServiceUrl, internalSecret, businessId, ownerJid, ownerMsg).catch(
                (e) => console.error("[Store Order] Failed to notify owner via WA:", e.message)
            );
        }

        return NextResponse.json(
            {
                success: true,
                order: {
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    totalAmount: order.totalAmount,
                    currency: order.currency,
                    status: order.status,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("[Store Order API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function sendWANotification(
    waServiceUrl: string,
    internalSecret: string,
    businessId: string,
    jid: string,
    text: string
) {
    const res = await fetch(`${waServiceUrl}/api/notify-customer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(internalSecret ? { "Authorization": `Bearer ${internalSecret}` } : {}),
        },
        body: JSON.stringify({ businessId, customerPhone: jid, message: { text } }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`WA service error: ${err}`);
    }
    return res.json();
}

function buildCustomerConfirmation(order: any, currency: string, storeName: string, slug: string): string {
    const itemLines = order.items
        .map((item: any) => `• ${item.quantity} × ${item.name}`)
        .join("\n");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return (
        `✅ *Order Received!*\n\n` +
        `Hi *${order.customerInfo?.name || "there"}!* Your order at *${storeName}* has been placed.\n\n` +
        `🧾 *Order #${order.orderNumber}*\n\n` +
        `📦 *Items:*\n${itemLines}\n\n` +
        `💰 *Total: ${currency} ${order.totalAmount.toLocaleString()}*\n` +
        `💳 *Payment:* ${order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}\n\n` +
        `We will confirm your order shortly.\n\n` +
        `📍 *Track your order:* Reply with *#${order.orderNumber}* anytime to get your order status.\n\n` +
        `🛍️ *Continue shopping:* ${appUrl}/store/${slug}`
    );
}

function buildOwnerNotification(order: any, business: any, currency: string): string {
    const itemLines = order.items
        .map((item: any) => `• ${item.quantity} × ${item.name} — ${currency} ${(item.price * item.quantity).toLocaleString()}`)
        .join("\n");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return (
        `🔔 *New Web Order!*\n\n` +
        `Order *#${order.orderNumber}*\n` +
        `📌 *Source:* Website\n\n` +
        `👤 *Customer:* ${order.customerInfo?.name || "Guest"}\n` +
        `📞 *Phone:* +${order.customerInfo?.phone}\n` +
        `📍 *Address:* ${order.deliveryDetails?.address}, ${order.deliveryDetails?.city}\n` +
        `💳 *Payment:* ${order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}\n\n` +
        `📦 *Items:*\n${itemLines}\n\n` +
        `💰 *Total: ${currency} ${order.totalAmount.toLocaleString()}*\n\n` +
        `👉 View & manage: ${appUrl}/dashboard/orders`
    );
}
