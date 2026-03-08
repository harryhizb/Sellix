import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Course } from "@/models/Course";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const courses = await Course.find({ businessId: user.businessId })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ courses });
    } catch (error: any) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        if (!body.name) {
            return NextResponse.json({ error: "Course name is required" }, { status: 400 });
        }

        const course = await Course.create({
            businessId: user.businessId,
            name: body.name,
            courseType: body.courseType || "other",
            duration: body.duration || "",
            description: body.description || "",
            admissionFee: body.admissionFee || 0,
            scholarships: body.scholarships || [],
        });

        return NextResponse.json({ course }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating course:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
