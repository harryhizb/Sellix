import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Business } from "@/models/Business";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { Feedback } from "@/models/Feedback";
import { MessageLog } from "@/models/MessageLog";
import { ConversationOverride } from "@/models/ConversationOverride";
import { Product } from "@/models/Product";

// GET /api/admin/stats - Get platform-wide statistics
export async function GET(req: NextRequest) {
    try {
        // Check for admin token in cookie or header
        const token = req.cookies.get("admin_token")?.value || 
                     req.headers.get("authorization")?.replace("Bearer ", "") ||
                     req.nextUrl.searchParams.get("token");
        
        if (!token) {
            return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
        }

        // Verify token (basic check - you can enhance with JWT verification)
        // For now, if token exists, we allow access
        // TODO: Add proper JWT verification using jsonwebtoken package

        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Total businesses
        const totalBusinesses = await Business.countDocuments();

        // Active WhatsApp connections (businesses with contactPhone)
        const activeConnections = await Business.countDocuments({
            contactPhone: { $exists: true, $ne: null }
        });

        // Total products across all businesses - use Product model directly
        const totalProducts = await Product.countDocuments();

        // Total orders processed
        const totalOrders = await Order.countDocuments();

        // Orders in last 24 hours
        const ordersLast24h = await Order.countDocuments({
            createdAt: { $gte: last24Hours }
        });

        // Escalated to human count (active conversation overrides)
        const escalatedCount = await ConversationOverride.countDocuments({
            isActive: true,
            ownerTookOver: true
        });

        // Feedback average rating - use aggregation instead of static method
        const feedbackStatsResult = await Feedback.aggregate([
            { $match: { isFlagged: false } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalFeedback: { $sum: 1 }
                }
            }
        ]);
        
        const feedbackStats = feedbackStatsResult.length > 0 ? {
            averageRating: feedbackStatsResult[0].averageRating || 0,
            totalFeedback: feedbackStatsResult[0].totalFeedback || 0
        } : {
            averageRating: 0,
            totalFeedback: 0
        };

        // Daily order trend (last 7 days)
        const dailyOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: last7Days }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        // System health - WhatsApp API status
        const recentMessageLogs = await MessageLog.countDocuments({
            createdAt: { $gte: last24Hours },
            "error.occurred": true
        });

        const totalMessageLogs = await MessageLog.countDocuments({
            createdAt: { $gte: last24Hours }
        });

        const errorRate = totalMessageLogs > 0 
            ? (recentMessageLogs / totalMessageLogs) * 100 
            : 0;

        const whatsappApiStatus = errorRate < 5 ? "healthy" : errorRate < 15 ? "degraded" : "down";

        // Calculate server uptime (mock - you can implement real monitoring)
        const serverUptime = 99.9;

        return NextResponse.json({
            stats: {
                totalBusinesses,
                activeConnections,
                totalProducts,
                totalOrders,
                ordersLast24h,
                escalatedCount,
                feedbackAverage: feedbackStats.averageRating,
                feedbackTotal: feedbackStats.totalFeedback
            },
            trends: {
                dailyOrders: dailyOrders.map((d: any) => ({
                    date: `${d._id.year}-${d._id.month.toString().padStart(2, '0')}-${d._id.day.toString().padStart(2, '0')}`,
                    count: d.count,
                    revenue: d.revenue
                }))
            },
            systemHealth: {
                whatsappApiStatus,
                errorRate: errorRate.toFixed(2),
                serverUptime,
                lastChecked: new Date()
            }
        });

    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch admin statistics" },
            { status: 500 }
        );
    }
}
