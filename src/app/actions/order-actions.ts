"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refreshAccessToken } from "@/lib/auth";

interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;  // NEW: Filter by order type
  search?: string;
  startDate?: string;
  endDate?: string;
}

export async function getOrders(params: GetOrdersParams = {}) {
  try {
    // Get token from cookies - check for both token and refreshToken
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    console.log(`[getOrders] Token present: ${!!token}, RefreshToken present: ${!!refreshToken}`);

    // If no refresh token, redirect to login (Middleware handles this, but as fallback)
    if (!refreshToken) {
      console.log("[getOrders] No refresh token found, redirecting");
      redirect("/login");
    }

    // Use token if present
    if (token) {
      console.log("[getOrders] Fetching with existing token");
      return await fetchOrdersWithToken(token, params);
    }

    // If we get here, token is missing. Middleware should have refreshed it.
    // This might happen if the token just expired or internal fetch failed.
    console.log("[getOrders] Token missing even after Middleware. Redirecting to login.");
    redirect("/login");



    // Fallback: try to fetch without token (some endpoints might be public)
    return await fetchOrdersWithToken(undefined, params);

  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error in getOrders:", error);

    // If unauthorized, redirect to login
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      redirect("/login");
    }

    return {
      orders: [],
      statistics: {},
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
      },
      error: error instanceof Error ? error.message : "Failed to fetch orders"
    };
  }
}

async function fetchOrdersWithToken(token: string | undefined, params: GetOrdersParams) {
  // Construct query params
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.status && params.status !== "all") queryParams.set("status", params.status);
  if (params.type && params.type !== "all") queryParams.set("type", params.type); // NEW
  if (params.search) queryParams.set("search", params.search);
  if (params.startDate) queryParams.set("startDate", params.startDate);
  if (params.endDate) queryParams.set("endDate", params.endDate);

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;

    // Crucial for Next.js SSR fetching against same-origin API routes to pass cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
    if (allCookies) {
      headers["Cookie"] = allCookies;
    }
  }

  // Fetch from your API route
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/orders?${queryParams.toString()}`,
    {
      headers,
      cache: "no-store",
    }
  );

  if (res.status === 401) {
    // Token expired or invalid
    throw new Error("Unauthorized - Token expired");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.statusText}`);
  }

  const data = await res.json();

  return {
    orders: data.orders || [],
    statistics: data.statistics || {},
    pagination: data.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1
    }
  };
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