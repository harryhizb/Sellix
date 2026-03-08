import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Appointment } from "@/models/Appointment";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const date = searchParams.get("date");

        const query: any = { businessId: user.businessId };
        if (status && status !== "all") query.status = status;
        if (date) {
            const d = new Date(date);
            query.date = { $gte: new Date(d.setHours(0, 0, 0, 0)), $lte: new Date(d.setHours(23, 59, 59, 999)) };
        }

        const appointments = await Appointment.find(query)
            .sort({ date: -1, time: -1 })
            .lean();

        return NextResponse.json({ appointments });
    } catch (error: any) {
        console.error("Error fetching appointments:", error);
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
        if (!body.customerName || !body.date || !body.time) {
            return NextResponse.json({ error: "Customer name, date, and time are required" }, { status: 400 });
        }

        const appointment = await Appointment.create({
            businessId: user.businessId,
            customerName: body.customerName,
            customerPhone: body.customerPhone || "",
            serviceName: body.serviceName || "",
            serviceId: body.serviceId,
            customerId: body.customerId,
            date: new Date(body.date),
            time: body.time,
            notes: body.notes || "",
        });

        return NextResponse.json({ appointment }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating appointment:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
