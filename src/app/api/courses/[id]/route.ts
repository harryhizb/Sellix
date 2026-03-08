import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Course } from "@/models/Course";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const course = await Course.findOneAndUpdate(
            { _id: params.id, businessId: user.businessId },
            { $set: body },
            { new: true }
        );

        if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
        return NextResponse.json({ course });
    } catch (error: any) {
        console.error("Error updating course:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const course = await Course.findOneAndDelete({ _id: params.id, businessId: user.businessId });
        if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

        return NextResponse.json({ message: "Course deleted" });
    } catch (error: any) {
        console.error("Error deleting course:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
