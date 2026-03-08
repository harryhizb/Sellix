import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Event } from "@/models/Event";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const events = await Event.find({ businessId: user.businessId })
            .sort({ dateTime: -1 })
            .lean();

        return NextResponse.json({ events });
    } catch (error: any) {
        console.error("Error fetching events:", error);
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
        if (!body.name || !body.dateTime) {
            return NextResponse.json({ error: "Name and date/time are required" }, { status: 400 });
        }

        const event = await Event.create({
            businessId: user.businessId,
            name: body.name,
            dateTime: new Date(body.dateTime),
            registrationType: body.registrationType || "free",
            registrationFee: body.registrationFee || 0,
            allowedParticipants: body.allowedParticipants || 100,
            registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : undefined,
            description: body.description || "",
            confirmationMethod: body.confirmationMethod || "manual",
            paymentInstructions: body.paymentInstructions || "",
        });

        return NextResponse.json({ event }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating event:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
