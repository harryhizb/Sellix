import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Product } from "@/models/Product";

// GET /api/admin/products/stats - Get total product count across all businesses
export async function GET(req: NextRequest) {
    try {
        // Check for admin token
        const token = req.cookies.get("admin_token")?.value || 
                     req.headers.get("authorization")?.replace("Bearer ", "") ||
                     req.nextUrl.searchParams.get("token");
        
        if (!token) {
            return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
        }

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || "");

        // Get total product count
        const totalProducts = await Product.countDocuments();

        // Get products by category breakdown
        const productsByCategory = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get active vs inactive products
        const activeProducts = await Product.countDocuments({ isActive: true });
        const inactiveProducts = await Product.countDocuments({ isActive: false });

        // Get products with stock issues
        const outOfStock = await Product.countDocuments({ 
            $or: [
                { stockQuantity: 0 },
                { inStock: false }
            ]
        });

        return NextResponse.json({
            totalProducts,
            activeProducts,
            inactiveProducts,
            outOfStock,
            productsByCategory: productsByCategory.reduce((acc: any, item: any) => {
                acc[item._id || 'uncategorized'] = item.count;
                return acc;
            }, {})
        });

    } catch (error) {
        console.error("Admin products stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch product statistics" },
            { status: 500 }
        );
    }
}
