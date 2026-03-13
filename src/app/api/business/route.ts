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

        let updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone;
        if (body.ownerPhone !== undefined) updateData.ownerPhone = body.ownerPhone;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.paymentInstructions !== undefined) updateData.paymentInstructions = body.paymentInstructions;
        if (body.tone !== undefined) updateData.tone = body.tone;
        if (body.currency !== undefined) updateData.currency = body.currency;
        if (body.templateType !== undefined) updateData.templateType = body.templateType;
        if (body.policies !== undefined) updateData.policies = body.policies;
        if (body.settings !== undefined) updateData.settings = body.settings;
        if (body.operatingHours !== undefined) updateData.operatingHours = body.operatingHours;
        if (body.onboardingComplete !== undefined) updateData.onboardingComplete = body.onboardingComplete;

        // Deep merge storefront object so it doesn't overwrite unrelated keys
        if (body.storefront !== undefined) {
            for (const [key, value] of Object.entries(body.storefront)) {
                updateData[`storefront.${key}`] = value;
            }
        }

        if (body.slug) {
            const formattedSlug = body.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, '');
            // Check if slug is taken by ANOTHER business
            const existing = await Business.findOne({ slug: formattedSlug, _id: { $ne: user.businessId } });
            if (existing) {
                return NextResponse.json({ error: "Store link is already taken. Please choose another." }, { status: 400 });
            }
            updateData.slug = formattedSlug;
        }

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
