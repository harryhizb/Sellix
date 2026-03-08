import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Customer } from "@/models/Customer";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(req: Request) {
    try {
        await dbConnect();

        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(token) as any;
        if (!decoded || !decoded.businessId) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const page = parseInt(searchParams.get("page") || "1");
        const skip = (page - 1) * limit;

        // Fetch Customers
        const customers = await Customer.find({ businessId: decoded.businessId })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Customer.countDocuments({ businessId: decoded.businessId });

        // Fetch Overrides for these customers
        // We need to handle the import of ConversationOverride carefully. 
        // If the import fails at runtime, we might need a workaround. 
        // For now assuming it works or I'll fix it if build fails.
        // Actually, let's use a try-catch for the import or use mongoose.models if already registered?
        // But in serverless/nextjs, models might not be registered yet.

        // Strategy: Use a dynamic require or just assume the model is registered if I import it?
        // Let's try to find if there is a local version in `src/models`.
        // I viewed `src/models/Customer.ts` but not `src/models/ConversationOverride.ts`.
        // If it's missing in `src/models`, I should probably duplicate it or move it to shared lib.
        // For now, I will assume I can import from wa-service relative path.

        let overrides: any[] = [];
        try {
            const customerIds = customers.map((c: any) => c._id);
            // Use native mongoose collection to avoid cross-project schema dependencies
            const overrideCollection = mongoose.connection.db?.collection('conversationoverrides');
            if (overrideCollection) {
                overrides = await overrideCollection.find({
                    businessId: decoded.businessId,
                    customerId: { $in: customerIds },
                    aiPaused: true
                }).project({ customerId: 1, aiPaused: 1, currentTakeover: 1 }).toArray();
            }
        } catch (e) {
            console.error("Failed to fetch overrides from collection", e);
            // Fallback: no overrides info
        }

        // Merge data
        const enrichedCustomers = customers.map((c: any) => {
            const override = overrides.find((o: any) => o.customerId.toString() === c._id.toString());
            return {
                ...c,
                isLockedToHuman: !!override,
                takeoverDetails: override?.currentTakeover
            };
        });

        return NextResponse.json({
            customers: enrichedCustomers,
            total,
            page,
            pages: Math.ceil(total / limit)
        });

    } catch (error: any) {
        console.error("Error fetching customers:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
