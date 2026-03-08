import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { Business } from "@/models/Business";

export async function GET(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Missing access token" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    // @ts-ignore
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Populate business data for strict onboarding gate
    let businessData = null;
    if (user.businessId) {
        // @ts-ignore
        const business = await Business.findById(user.businessId);
        if (business) {
            // Derive dashboard category from capabilities (if available)
            let dashboardCategory = business.category || "other";
            if (business.capabilities) {
                if (business.capabilities.supportsProducts) {
                    dashboardCategory = "ecommerce";
                } else if (business.capabilities.supportsServices || business.capabilities.supportsBooking) {
                    dashboardCategory = "service";
                } else if (business.capabilities.supportsInformation) {
                    dashboardCategory = "institute";
                }
            }

            businessData = {
                category: dashboardCategory,           // corrected for dashboard
                name: business.name,
                onboardingComplete: business.onboardingComplete || false,
                capabilities: business.capabilities || {
                    supportsProducts: true,
                    supportsServices: false,
                    supportsBooking: false,
                    supportsCart: true,
                    supportsApproval: true,
                    supportsInformation: false
                }
            };
        }
    }

    return NextResponse.json({
        user,
        business: businessData
    });
}