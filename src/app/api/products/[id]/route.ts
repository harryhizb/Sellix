import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

// GET - Fetch single product by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const { id } = await params;
        await dbConnect();
        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const product = await Product.findOne({ _id: id, businessId: user.businessId });

        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        return NextResponse.json({ product });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Update product
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const { id } = await params;
        const body = await req.json();
        await dbConnect();
        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const product = await Product.findOneAndUpdate(
            { _id: id, businessId: user.businessId },
            { $set: body },
            { new: true }
        );

        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        return NextResponse.json({ product });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const { id } = await params;
        await dbConnect();
        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const product = await Product.findOneAndDelete({ _id: id, businessId: user.businessId });

        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
