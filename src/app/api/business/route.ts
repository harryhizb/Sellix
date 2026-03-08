import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Business } from "@/models/Business";
import { User } from "@/models/User";

// GET: Fetch Business Settings
export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    // @ts-ignore
    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const business = await Business.findById(user.businessId);
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    return NextResponse.json({ business });
}

// PUT: Update Business Settings
export async function PUT(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const body = await req.json();
        await dbConnect();

        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        let updateData: any = {
            name: body.name,
            description: body.description,
            contactPhone: body.contactPhone,
            ownerPhone: body.ownerPhone,
            address: body.address,
            paymentInstructions: body.paymentInstructions,
            tone: body.tone,
            currency: body.currency,
            templateType: body.templateType,
            policies: body.policies,
            settings: body.settings,
            operatingHours: body.operatingHours,
            onboardingComplete: body.onboardingComplete
        };

        if (body.features) {
            updateData.capabilities = {
                supportsProducts: body.features.includes('products') || false,
                supportsServices: body.features.includes('services') || false,
                supportsBooking: body.features.includes('services') || false,
                supportsCart: body.features.includes('products') || false,
                supportsApproval: body.features.includes('approval') || false,
                supportsInformation: body.features.includes('info') || false
            };
            updateData.category = body.features.includes('products') ? 'ecommerce' : (body.features.includes('services') ? 'service' : 'institute');
        } else if (body.category) {
            updateData.category = body.category;
        }

        const business = await Business.findOneAndUpdate(
            { _id: user.businessId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return NextResponse.json({ success: true, business });
    } catch (error: any) {
        console.error("Business update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
