import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { IProduct, Product } from "@/models/Product"; // Import from Product model
import { User } from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextRequest } from "next/server";
import { Business } from "@/models/Business"; // Named import, not default
import mongoose from "mongoose";

// PATCH: Update product attributes
export async function PATCH(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const body = await req.json();
        const { productId, attributes } = body;

        if (!productId || !attributes) {
            return NextResponse.json({ error: "productId and attributes are required" }, { status: 400 });
        }

        await dbConnect();

        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Ensure the product belongs to the user's business
        const product = await Product.findOne({ _id: productId, businessId: user.businessId });
        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        // Initialize attributes object if undefined
        product.attributes = product.attributes || {};

        // Merge the incoming attributes into existing attributes
        for (const key in attributes) {
            if (Object.prototype.hasOwnProperty.call(attributes, key)) {
                // @ts-ignore
                product.attributes[key] = attributes[key];
            }
        }

        await product.save();

        return NextResponse.json({ product }, { status: 200 });
    } catch (error: any) {
        console.error("Update product attributes error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Fetch all products for the user's business
export async function GET(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        await dbConnect();

        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const products = await Product.find({ businessId: user.businessId });
        return NextResponse.json({ products: products || [] }, { status: 200 });
    } catch (error: any) {
        console.error("Fetch products error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new product
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const body = await req.json();
        const {
            name,
            price,
            description,
            attributes = {},
            inStock = true,
            currency = "USD",
            imageUrl = "",
            stockQuantity = 0,
            discountValue = 0,
            category = "",
            businessId,
            variants = [],
            tags = [],
            isActive = true,
            images = []
        } = body;

        if (!name) return NextResponse.json({ error: "Product name is required" }, { status: 400 });
        if (price === undefined || price === null) return NextResponse.json({ error: "Product price is required" }, { status: 400 });
        if (!businessId) return NextResponse.json({ error: "Business ID is required" }, { status: 400 });

        await dbConnect();

        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Get business to determine default category
        const business = await Business.findById(businessId);
        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

        // Prepare product data with proper category handling
        const productData: any = {
            businessId: new mongoose.Types.ObjectId(businessId),
            name,
            price: Number(price),
            description: description || "",
            attributes,
            inStock: Boolean(inStock),
            currency: currency || "USD",
            imageUrl: imageUrl || "",
            stockQuantity: Number(stockQuantity) || 0,
            category: category || business.category || "general",
            variants: variants || [],
            tags: tags || [],
            isActive: true, // Always set to true as requested
        };

        // Add images if provided
        if (images && images.length > 0) {
            productData.images = images;
        }

        // Add discount if provided (support both old discountValue and new discount object)
        const discountObj = body.discount || (discountValue > 0 ? { type: "percentage", value: discountValue } : null);
        if (discountObj && discountObj.value > 0) {
            productData.discount = {
                type: discountObj.type || "percentage",
                value: Number(discountObj.value),
                validUntil: discountObj.validUntil ? new Date(discountObj.validUntil) : undefined
            };
        }

        const product = await Product.create(productData);

        return NextResponse.json({ 
            product,
            message: "Product created successfully" 
        }, { status: 201 });
    } catch (error: any) {
        console.error("Create product error:", error);
        return NextResponse.json({ 
            error: error.message || "Failed to create product",
            details: error.errors || null 
        }, { status: 500 });
    }
}

// PUT: Update a product
export async function PUT(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

        await dbConnect();

        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Ensure the product belongs to the user's business
        const existingProduct = await Product.findOne({ _id: id, businessId: user.businessId });
        if (!existingProduct) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        // Convert numeric fields
        if (updateData.price !== undefined) updateData.price = Number(updateData.price);
        if (updateData.stockQuantity !== undefined) updateData.stockQuantity = Number(updateData.stockQuantity);
        if (updateData.discountValue !== undefined) updateData.discountValue = Number(updateData.discountValue);
        
        // Always ensure isActive is true
        updateData.isActive = true;

        // Handle discount
        if (updateData.discountValue && updateData.discountValue > 0) {
            updateData.discount = {
                type: "percentage",
                value: updateData.discountValue,
                validUntil: updateData.discountValidUntil ? new Date(updateData.discountValidUntil) : undefined
            };
            delete updateData.discountValue;
            delete updateData.discountValidUntil;
        } else {
            updateData.discount = undefined;
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        return NextResponse.json({ 
            product,
            message: "Product updated successfully" 
        }, { status: 200 });
    } catch (error: any) {
        console.error("Update product error:", error);
        return NextResponse.json({ 
            error: error.message || "Failed to update product",
            details: error.errors || null 
        }, { status: 500 });
    }
}

// DELETE: Delete a product
export async function DELETE(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

        await dbConnect();

        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Ensure the product belongs to the user's business
        const product = await Product.findOne({ _id: id, businessId: user.businessId });
        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        await Product.findByIdAndDelete(id);

        return NextResponse.json({ 
            message: "Product deleted successfully" 
        }, { status: 200 });
    } catch (error: any) {
        console.error("Delete product error:", error);
        return NextResponse.json({ 
            error: error.message || "Failed to delete product",
            details: error.errors || null 
        }, { status: 500 });
    }
}