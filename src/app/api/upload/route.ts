import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
        }
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
        const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
        const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

        if (!cloudName || !apiKey || !apiSecret) {
            console.error("[Upload] Cloudinary env vars missing:", { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret });
            return NextResponse.json({ error: "Cloudinary not configured on server" }, { status: 500 });
        }

        // Build signed upload
        const timestamp = Math.round(Date.now() / 1000);
        const folder = "whatsapp-saas/products";

        // Sign: params must be sorted alphabetically
        const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");

        // Convert File to ArrayBuffer then Buffer for fetch compatibility
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Build multipart form using Node.js compatible approach
        const boundary = `----FormBoundary${Date.now()}`;
        const parts: Buffer[] = [];

        const addField = (name: string, value: string) => {
            parts.push(Buffer.from(
                `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
            ));
        };

        addField("api_key", apiKey);
        addField("timestamp", String(timestamp));
        addField("signature", signature);
        addField("folder", folder);

        // Add file part
        parts.push(Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`
        ));
        parts.push(buffer);
        parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

        const body = Buffer.concat(parts);

        const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: "POST",
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${boundary}`,
                    "Content-Length": String(body.length),
                },
                body,
            }
        );

        const result = await uploadRes.json();

        if (!uploadRes.ok) {
            console.error("[Upload] Cloudinary error:", result);
            return NextResponse.json({ error: result.error?.message || "Upload failed" }, { status: 500 });
        }

        return NextResponse.json({
            publicId: result.public_id,
            secureUrl: result.secure_url,
        });

    } catch (error: any) {
        console.error("[Upload] Unexpected error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
