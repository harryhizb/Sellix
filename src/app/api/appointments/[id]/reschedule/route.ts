import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Appointment } from "@/models/Appointment";

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
        if (!body.date || !body.time) {
            return NextResponse.json({ error: "New date and time are required" }, { status: 400 });
        }

        const appointment = await Appointment.findOneAndUpdate(
            { _id: params.id, businessId: user.businessId },
            {
                $set: {
                    status: "rescheduled",
                    rescheduledTo: new Date(body.date),
                    rescheduledTime: body.time,
                    date: new Date(body.date),
                    time: body.time,
                    feedback: body.feedback || "",
                }
            },
            { new: true }
        );

        if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        return NextResponse.json({ appointment });
    } catch (error: any) {
        console.error("Error rescheduling appointment:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
