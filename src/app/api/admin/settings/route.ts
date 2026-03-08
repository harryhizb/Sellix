import { NextRequest, NextResponse } from "next/server";
import { AdminSettings } from "@/models/AdminSettings";

// GET /api/admin/settings - Get admin settings
export async function GET(req: NextRequest) {
    try {
        // Find existing settings or create new one
        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = await AdminSettings.create({});
        }
        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Admin settings get error:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/settings - Update admin settings
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Find existing settings or create new one
        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = await AdminSettings.create({});
        }

        // Update allowed fields
        if (body.systemConfig) {
            Object.assign(settings.systemConfig, body.systemConfig);
        }

        if (body.whatsappApi) {
            Object.assign(settings.whatsappApi, body.whatsappApi);
        }

        if (body.smtpSettings) {
            Object.assign(settings.smtpSettings, body.smtpSettings);
        }

        if (body.featureToggles) {
            Object.assign(settings.featureToggles, body.featureToggles);
        }

        if (body.rateLimiting) {
            Object.assign(settings.rateLimiting, body.rateLimiting);
        }

        if (body.security) {
            Object.assign(settings.security, body.security);
        }

        if (body.notifications) {
            Object.assign(settings.notifications, body.notifications);
        }

        if (body.analytics) {
            Object.assign(settings.analytics, body.analytics);
        }

        // TODO: Set updatedBy when user authentication is implemented
        await settings.save();

        return NextResponse.json({
            success: true,
            settings
        });

    } catch (error) {
        console.error("Admin settings update error:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
