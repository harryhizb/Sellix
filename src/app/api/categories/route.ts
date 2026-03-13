import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { Category } from "@/models/Category";
import { User } from "@/models/User";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

// GET: List all categories for the authenticated business
export async function GET(req: NextRequest) {
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

        const categories = await Category.find({ businessId: user.businessId }).sort({ name: 1 }).lean();
        return NextResponse.json({ categories }, { status: 200 });
    } catch (error: any) {
        console.error("Fetch categories error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new category
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const body = await req.json();
        const { name, emoji } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Category name is required" }, { status: 400 });
        }

        await dbConnect();
        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const category = await Category.create({
            businessId: new mongoose.Types.ObjectId(user.businessId),
            name: name.trim(),
            emoji: emoji?.trim() || "📦",
        });

        return NextResponse.json({ category, message: "Category created successfully" }, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
        }
        console.error("Create category error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete a category by id
export async function DELETE(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Category ID is required" }, { status: 400 });

        await dbConnect();
        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const category = await Category.findOneAndDelete({ _id: id, businessId: user.businessId });
        if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

        return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Delete category error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
