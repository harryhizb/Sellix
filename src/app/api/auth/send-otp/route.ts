import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { VerificationCode } from "@/models/VerificationCode";
import { User } from "@/models/User";
import nodemailer from "nodemailer";
import logger from "@/lib/logger";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { email, type } = await req.json();

        if (!email || !type || !["signup", "login"].includes(type)) {
            return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });

        if (type === "signup" && existingUser) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        if (type === "login" && !existingUser) {
            return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
        }

        // Generate 6-digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Upsert code for this email and type
        await VerificationCode.findOneAndUpdate(
            { email, type },
            { code, expiresAt },
            { upsert: true, new: true }
        );

        // In development without SMTP credentials, just log the OTP
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            logger.warn(`[DEV MODE] OTP generated for ${email} [${type}]: ${code}`);
            return NextResponse.json({ message: "Verification code sent successfully (Dev Mode)", devOtp: code });
        }

        // Send Email
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Sellix Admin" <noreply@sellix.com>',
            to: email,
            subject: type === "signup" ? "Verify your Sellix account" : "Your Sellix login code",
            html: `
                <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                    <h2 style="color: #25D366; text-align: center;">Sellix Authentication</h2>
                    <p style="font-size: 16px; color: #333;">Hello,</p>
                    <p style="font-size: 16px; color: #333;">Your verification code is:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${code}
                    </div>
                    <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Verification OTP sent to ${email} for ${type}`);

        return NextResponse.json({ message: "Verification code sent successfully" });
    } catch (error) {
        logger.error("Send OTP error", error);
        return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
    }
}
