import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from "../../../../lib/db";
import { Business } from "@/models/Business";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/User";

const onboardingSchema = z.object({
    features: z.array(z.string()).optional(),
    name: z.string().min(1).max(100),
    ownerPhone: z.string().optional(),
    description: z.string().optional(),
    tone: z.string().optional(),
    personality: z.any().optional(),
    aiSettings: z.any().optional(),
    settings: z.any().optional(),
    policies: z.any().optional(),
    address: z.string().optional(),
    contactPhone: z.string().optional(),
    operatingHours: z.any().optional(),
    metadata: z.any().optional(),
    configVersion: z.number().optional(),
    capabilities: z.any().optional(),
    category: z.string().optional(),
});

export async function PATCH(req: Request) {
    try {
        await dbConnect();

        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded || typeof decoded === "string" || !decoded.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = onboardingSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid request data",
                details: validation.error.issues
            }, { status: 400 });
        }

        const {
            features, tone, name, description, address, ownerPhone, contactPhone,
            personality, aiSettings, settings, policies, operatingHours, metadata,
            capabilities: capabilitiesFromBody, category
        } = body;

        // Use capabilities from body if provided, otherwise map from features
        const capabilities = capabilitiesFromBody || {
            supportsProducts: features?.includes('products') || false,
            supportsServices: features?.includes('services') || false,
            supportsBooking: features?.includes('services') || false,
            supportsCart: features?.includes('products') || false,
            supportsInformation: features?.includes('info') || false
        };

        const user = await User.findById(decoded.userId);
        if (!user || !user.businessId) return NextResponse.json({ error: "Business not found" }, { status: 404 });

        const business = await Business.findByIdAndUpdate(
            user.businessId,
            {
                $set: {
                    name,
                    description,
                    address,
                    ownerPhone,
                    contactPhone,
                    tone,
                    personality,
                    aiSettings,
                    settings,
                    policies,
                    operatingHours,
                    metadata,
                    capabilities,
                    category: category || 'ecommerce',
                    onboardingComplete: true,
                    lastAIConfigUpdate: new Date(),
                }
            },
            { new: true, runValidators: true }
        );

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

        return NextResponse.json({ success: true, business });
    } catch (error: any) {
        console.error("Onboarding error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}