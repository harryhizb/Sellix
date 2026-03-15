"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { getOrdersData } from "@/lib/services/order-service";

interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export async function getOrders(params: GetOrdersParams = {}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      redirect("/login");
    }

    if (token) {
      const decoded = verifyToken(token) as any;
      if (!decoded || !decoded.businessId) {
        // If token invalid, middleware should have handled it, but as fallback:
        redirect("/login");
      }

      return await getOrdersData({
        ...params,
        businessId: decoded.businessId
      });
    }

    redirect("/login");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error in getOrders action:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      redirect("/login");
    }

    return {
      orders: [],
      statistics: {},
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      error: error instanceof Error ? error.message : "Failed to fetch orders"
    };
  }
}

// Optional: Helper function to get current user from token
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    // Decode the token to get user info (client-side decoding)
    // Note: This only works if you have a way to decode without the secret
    // Alternatively, create a /api/auth/me endpoint
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.ok) {
      return await res.json();
    }

    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}