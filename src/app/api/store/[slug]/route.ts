import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Business } from "@/models/Business";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";

export async function GET(
    req: Request,
    { params }: { params: { slug: string } }
) {
    try {
        await dbConnect();

        const business = await Business.findOne({ slug: params.slug }).lean() as any;
        if (!business) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");
        const categoryId = searchParams.get("categoryId");

        // Single product detail
        if (productId) {
            const product = await Product.findOne({
                _id: productId,
                businessId: business._id,
                isActive: true,
            }).lean();
            if (!product) {
                return NextResponse.json({ error: "Product not found" }, { status: 404 });
            }
            return NextResponse.json({
                business: {
                    _id: business._id,
                    name: business.name,
                    slug: business.slug,
                    description: business.description,
                    settings: business.settings,
                    storefront: business.storefront || {},
                },
                product,
            });
        }

        // Fetch categories for this business
        const categories = await Category.find({ businessId: business._id })
            .sort({ name: 1 })
            .lean();

        // Build product query — optionally filter by categoryId
        const productQuery: any = {
            businessId: business._id,
            isActive: true,
        };
        if (categoryId) {
            productQuery.categoryId = categoryId;
        }

        // Full storefront: business info + categories + products
        const products = await Product.find(productQuery)
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            business: {
                _id: business._id,
                name: business.name,
                slug: business.slug,
                description: business.description,
                address: business.address,
                contactPhone: business.contactPhone,
                settings: business.settings,
                policies: business.policies,
                storefront: business.storefront || {},
            },
            categories,
            products,
        });
    } catch (error: any) {
        console.error("[Store API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

