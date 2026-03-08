import { NextRequest, NextResponse } from "next/server";
import { Business } from "@/models/Business";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { ConversationOverride } from "@/models/ConversationOverride";

// GET /api/admin/businesses - List all businesses with pagination and filters
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const category = searchParams.get("category") || "";

        const skip = (page - 1) * limit;

        // Build query
        const query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { contactPhone: { $regex: search, $options: "i" } }
            ];
        }

        if (status) {
            query.status = status;
        }

        if (category) {
            query.category = category;
        }

        // Get total count
        const total = await Business.countDocuments(query);

        // Get businesses with aggregated data
        const businesses = await Business.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "orders",
                    localField: "_id",
                    foreignField: "businessId",
                    as: "orders"
                }
            },
            {
                $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "businessId",
                    as: "customers"
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "businessId",
                    as: "products"
                }
            },
            {
                $addFields: {
                    totalOrders: { $size: "$orders" },
                    totalCustomers: { $size: "$customers" },
                    totalProducts: { $size: "$products" },
                    status: { $ifNull: ["$status", "active"] }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    contactPhone: 1,
                    category: 1,
                    tone: 1,
                    onboardingComplete: 1,
                    totalOrders: 1,
                    totalCustomers: 1,
                    totalProducts: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        return NextResponse.json({
            businesses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Admin businesses list error:", error);
        return NextResponse.json(
            { error: "Failed to fetch businesses" },
            { status: 500 }
        );
    }
}

// POST /api/admin/businesses/:id/suspend - Suspend a business
export async function PATCH(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const action = searchParams.get("action");
        const businessId = searchParams.get("id");

        if (!businessId) {
            return NextResponse.json(
                { error: "Business ID required" },
                { status: 400 }
            );
        }

        const business = await Business.findById(businessId);
        if (!business) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        if (action === "suspend") {
            (business as any).status = "suspended";
        } else if (action === "reactivate") {
            (business as any).status = "active";
        } else if (action === "reset_connection") {
            // Reset connection logic would go here
            // This would typically involve WhatsApp session management
        }

        await business.save();

        return NextResponse.json({
            success: true,
            business: {
                _id: business._id,
                name: business.name,
                status: (business as any).status || "active"
            }
        });

    } catch (error) {
        console.error("Admin business action error:", error);
        return NextResponse.json(
            { error: "Failed to update business" },
            { status: 500 }
        );
    }
}
