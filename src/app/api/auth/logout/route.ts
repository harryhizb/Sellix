import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import { Session } from "@/models/Session";
import logger from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refreshToken")?.value;

        if (refreshToken) {
            await dbConnect();
            await Session.deleteOne({ refreshToken });
        }

        const response = NextResponse.json({ success: true });
        response.cookies.delete("refreshToken");
        return response;
    } catch (error) {
        logger.error("Logout error", error);
        return NextResponse.json({ error: "Logout failed" }, { status: 500 });
    }
}
