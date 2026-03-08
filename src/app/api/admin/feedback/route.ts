import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Feedback } from "@/models/Feedback";
import dbConnect from "@/lib/db";

// POST /api/admin/feedback - Submit new feedback (from businesses/users to platform owner)
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
            businessId,
            source = "web",
            messageType = "feedback",
            subject = ""
        } = body;

        // Simple validation - only email required if provided
        if (customerEmail && !/^\S+@\S+\.\S+$/.test(customerEmail)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Create feedback document - everything is optional
        const feedback = await Feedback.create({
            businessId: businessId || null,
            customerId: null,
            customerName: customerName || null,
            customerPhone: customerPhone || null,
            customerEmail: customerEmail || null,
            rating: rating || null,
            comment: comment || null,
            categories: body.categories || {},
            source,
            messageType,
            subject,
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

// GET /api/admin/feedback - List all feedback with filters
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status") || "";
        const businessId = searchParams.get("businessId") || "";
        const rating = searchParams.get("rating");
        const isFlagged = searchParams.get("isFlagged");
        const messageType = searchParams.get("messageType") || ""; // Filter by message type
        const statsOnly = searchParams.get("stats");

        // Return stats only if requested
        if (statsOnly === "true") {
            const statsResult = await Feedback.aggregate([
                { $match: { isFlagged: false } },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: "$rating" },
                        totalFeedback: { $sum: 1 },
                        totalBusinesses: { $addToSet: "$businessId" }
                    }
                }
            ]);
            
            const stats = statsResult.length > 0 ? {
                averageRating: statsResult[0].averageRating || 0,
                totalFeedback: statsResult[0].totalFeedback || 0,
                totalBusinesses: statsResult[0].totalBusinesses.length || 0
            } : {
                averageRating: 0,
                totalFeedback: 0,
                totalBusinesses: 0
            };
            
            // Get distribution by business
            const byBusiness = await Feedback.aggregate([
                {
                    $group: {
                        _id: "$businessId",
                        averageRating: { $avg: "$rating" },
                        totalFeedback: { $sum: 1 }
                    }
                },
                { $sort: { totalFeedback: -1 } },
                { $limit: 10 }
            ]);
            
            return NextResponse.json({
                platformStats: stats,
                byBusiness
            });
        }

        const skip = (page - 1) * limit;

        // Build query
        const query: any = {};

        if (status) {
            query.status = status;
        }

        if (businessId) {
            query.businessId = businessId;
        }

        if (rating) {
            query.rating = parseInt(rating);
        }

        if (isFlagged !== null && isFlagged !== undefined) {
            query.isFlagged = isFlagged === "true";
        }

        if (messageType) {
            query.messageType = messageType;
        }

        // Get total count
        const total = await Feedback.countDocuments(query);

        // Get feedback with populated data
        const feedbackList = await Feedback.find(query)
            .populate("businessId", "name category")
            .populate("customerId", "name phone")
            .populate("orderId", "orderNumber totalAmount")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            feedback: feedbackList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Admin feedback list error:", error);
        return NextResponse.json(
            { error: "Failed to fetch feedback" },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/feedback/:id - Update feedback status
export async function PATCH(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const feedbackId = searchParams.get("id");
        const body = await req.json();

        if (!feedbackId) {
            return NextResponse.json(
                { error: "Feedback ID required" },
                { status: 400 }
            );
        }

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
            return NextResponse.json(
                { error: "Feedback not found" },
                { status: 404 }
            );
        }

        // Update fields
        if (body.status) {
            feedback.status = body.status;
        }

        if (body.adminNotes !== undefined) {
            feedback.adminNotes = body.adminNotes;
        }

        if (body.isFlagged !== undefined) {
            feedback.isFlagged = body.isFlagged;
            if (body.flagReason) {
                feedback.flagReason = body.flagReason;
            }
        }

        // Mark as reviewed
        feedback.reviewedAt = new Date();
        // TODO: Set reviewedBy when user authentication is implemented

        await feedback.save();

        return NextResponse.json({
            success: true,
            feedback
        });

    } catch (error) {
        console.error("Admin feedback update error:", error);
        return NextResponse.json(
            { error: "Failed to update feedback" },
            { status: 500 }
        );
    }
}
