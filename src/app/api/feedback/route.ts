import { NextRequest, NextResponse } from "next/server";
import { Feedback } from "@/models/Feedback";
import dbConnect from "@/lib/db";

// POST /api/feedback - Submit new feedback
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        const body = await req.json();
        const { 
            rating, 
            comment, 
            customerName, 
            customerPhone, 
            customerEmail,
            orderId,
            categories 
        } = body;

        // Validate required fields
        if (!rating || !comment) {
            return NextResponse.json(
                { error: "Rating and comment are required" },
                { status: 400 }
            );
        }

        // Get business ID from request (you should get this from auth token)
        // For now, we'll use a placeholder - you need to implement proper auth
        const businessId = body.businessId; // This should come from authenticated user
        
        if (!businessId) {
            return NextResponse.json(
                { error: "Business ID required" },
                { status: 400 }
            );
        }

        // Create feedback document
        const feedback = await Feedback.create({
            businessId,
            customerId: body.customerId || null, // Optional if not logged in
            orderId: orderId || null,
            customerName: customerName || null,
            customerPhone: customerPhone || null,
            rating,
            comment,
            categories: categories || {},
            source: "web",
            status: "pending",
            isFlagged: false
        });

        return NextResponse.json({
            success: true,
            message: "Feedback submitted successfully",
            feedback
        });

    } catch (error) {
        console.error("Feedback submission error:", error);
        return NextResponse.json(
            { error: "Failed to submit feedback" },
            { status: 500 }
        );
    }
}
