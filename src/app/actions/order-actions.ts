"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Order, OrderStatus } from "@/models/Order";
import { User } from "@/models/User";
import { Customer } from "@/models/Customer";
import { ConversationOverride } from "@/models/ConversationOverride";

interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

const emptyResult = {
  orders: [],
  statistics: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
};

function generateOrderSummary(order: any): string {
  const items = order.items
    .map(
      (item: any, index: number) =>
        `${index + 1}. ${item.name} (${item.quantity} x ${order.currency} ${item.price}) = ${order.currency} ${item.quantity * item.price}`
    )
    .join("\n");

  return `Order #${order.orderNumber}\nStatus: ${order.status?.toUpperCase()}\n\nItems:\n${items}\n\nTotal: ${order.currency} ${order.totalAmount}`;
}

export async function getOrders(params: GetOrdersParams = {}) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    // If no refresh token at all, user is not logged in — redirect
    if (!refreshToken) {
      console.log("[getOrders] No refresh token found, redirecting to login");
      redirect("/login");
    }

    // The access token may live in a cookie (set by middleware after refresh)
    // OR only in localStorage (set on initial login). If it's not in a cookie yet,
    // return an empty shell — the client-side React Query will fetch orders itself
    // using the token from localStorage.
    const token = cookieStore.get("token")?.value;
    if (!token) {
      console.log(
        "[getOrders] Token not in cookie yet (likely just logged in). Client will hydrate via React Query."
      );
      return emptyResult;
    }

    // Verify token
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.userId) {
      console.log(
        "[getOrders] Token invalid/expired. Returning empty shell for client hydration."
      );
      return emptyResult;
    }

    await dbConnect();

    // Ensure models are loaded
    if (!Customer || !Order || !User) {
      throw new Error("Models not properly registered");
    }

    const user = await (User as any).findById(decoded.userId).lean() as any;
    if (!user) {
      console.log("[getOrders] User not found in DB.");
      return emptyResult;
    }

    const {
      page = 1,
      limit = 20,
      status,
      type,
      startDate,
      endDate,
    } = params;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { businessId: user.businessId, isDeleted: false };

    console.log(
      `[getOrders SSR] User: ${user.email} | BusinessId: ${user.businessId}`
    );

    if (status && status !== "all") {
      query.status = status;
    }

    if (type && (type === "order" || type === "booking")) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("customerId", "name phone email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Fetch overrides
    const customerIds = (orders as any[])
      .map((o: any) => o.customerId?._id)
      .filter(Boolean);
    const overrides = await ConversationOverride.find({
      businessId: user.businessId,
      customerId: { $in: customerIds },
      isActive: true,
    }).lean();

    const ordersWithDetails = (orders as any[]).map((order: any) => {
      const override = (overrides as any[]).find(
        (ov: any) =>
          ov.customerId?.toString() === order.customerId?._id?.toString()
      );
      const summary = generateOrderSummary(order);
      return {
        ...order,
        isPaused: !!override?.ownerTookOver,
        summary,
        formattedOrderNumber: `ORD-${order.orderNumber?.slice(-6) || order._id.toString().slice(-6)}`,
      };
    });

    // Statistics via aggregation
    const stats = await Order.aggregate([
      { $match: { businessId: user.businessId, isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const statistics = {
      total: stats.reduce((sum: number, s: any) => sum + s.count, 0),
      pending: stats.find((s: any) => s._id === OrderStatus.PENDING)?.count || 0,
      confirmed: stats.find((s: any) => s._id === OrderStatus.CONFIRMED)?.count || 0,
      processing: stats.find((s: any) => s._id === OrderStatus.PROCESSING)?.count || 0,
      shipped: stats.find((s: any) => s._id === OrderStatus.SHIPPED)?.count || 0,
      delivered: stats.find((s: any) => s._id === OrderStatus.DELIVERED)?.count || 0,
      totalRevenue: stats.reduce((sum: number, s: any) => sum + s.totalRevenue, 0),
    };

    return {
      orders: ordersWithDetails,
      statistics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    // Let Next.js redirects propagate
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("[getOrders] Error:", error);
    // Return empty shell — client React Query will retry
    return emptyResult;
  }
}

// Helper to get current user from token cookie (for server components)
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.userId) return null;

    await dbConnect();
    const user = await (User as any)
      .findById(decoded.userId)
      .select("-password")
      .lean();
    return user || null;
  } catch (error) {
    console.error("[getCurrentUser] Error:", error);
    return null;
  }
}