import { NextResponse } from "next/server";

// POST /api/admin/auth/logout - Admin logout
export async function POST() {
    const response = NextResponse.json({
        success: true,
        message: "Logged out successfully"
    });

    // Clear the admin token cookie
    response.cookies.set("admin_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
        path: "/"
    });

    return response;
}
