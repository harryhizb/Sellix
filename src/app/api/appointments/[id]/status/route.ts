import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { Appointment } from "@/models/Appointment";
import { User } from "@/models/User";
import dbConnect from "@/lib/db";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const { id } = params;
        const body = await request.json();
        const { status, rescheduledTo, rescheduledTime, feedback } = body;

        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const appointment = await Appointment.findById(id);
        if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

        if (appointment.businessId.toString() !== user.businessId.toString()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (status) appointment.status = status;
        if (feedback) appointment.feedback = feedback;

        if (status === 'rescheduled' && rescheduledTo && rescheduledTime) {
            appointment.rescheduledTo = new Date(rescheduledTo);
            appointment.rescheduledTime = rescheduledTime;
            // Also update the main date/time for the calendar view
            appointment.date = new Date(rescheduledTo);
            appointment.time = rescheduledTime;
        }

        await appointment.save();

        // Trigger WhatsApp Notification via wa-service internal API
        try {
            let message = ``;
            if (status === 'confirmed') {
                message = `✅ *Booking Confirmed!*\n\nHi ${appointment.customerName}, your appointment for *${appointment.serviceName || 'Service'}* is confirmed for *${appointment.date.toDateString()}* at *${appointment.time}*.`;
            } else if (status === 'cancelled') {
                message = `❌ *Booking Cancelled*\n\nHi ${appointment.customerName}, your appointment for *${appointment.serviceName || 'Service'}* on *${appointment.date.toDateString()}* at *${appointment.time}* has been cancelled. Please reply if you'd like to rebook.`;
            } else if (status === 'rescheduled') {
                message = `🔄 *Booking Rescheduled*\n\nHi ${appointment.customerName}, your appointment for *${appointment.serviceName || 'Service'}* has been rescheduled to *${appointment.date.toDateString()}* at *${appointment.time}*.`;
            }

            if (message && appointment.customerPhone) {
                // Ensure phone number has country code
                const phone = appointment.customerPhone.replace(/\D/g, '');
                const waServiceUrl = process.env.WA_SERVICE_URL || 'http://localhost:3001';

                await fetch(`${waServiceUrl}/api/messages/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessId: user.businessId,
                        to: phone.includes('@s.whatsapp.net') ? phone : `${phone}@s.whatsapp.net`,
                        text: message
                    })
                });

                appointment.waMessageSent = true;
                appointment.notifiedAt = new Date();
                await appointment.save();
            }

            // Notify Dashboard (Real-time sync) via wa-service socket relay
            const waServiceUrl = process.env.WA_SERVICE_URL || 'http://localhost:3001';
            await fetch(`${waServiceUrl}/api/sockets/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId: user.businessId, event: 'refresh-data' })
            }).catch(e => console.error("Failed to route socket refresh:", e));

        } catch (waError) {
            console.error("Failed to send WA notification for appointment:", waError);
            // Non-fatal exception
        }

        return NextResponse.json({ success: true, appointment });

    } catch (error: any) {
        console.error("Error updating appointment status:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
