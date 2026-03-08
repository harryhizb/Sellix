import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refreshToken")?.value;

        if (!refreshToken) {
            return NextResponse.json({ error: "No refresh token" }, { status: 401 });
        }

        const result = await refreshAccessToken(refreshToken);

        if (!result) {
            return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
        }

        const response = NextResponse.json({ accessToken: result.accessToken });

        response.cookies.set("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        logger.error("Refresh error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
