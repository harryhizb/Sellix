// wa-service/src/index.ts
import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import { connectDB } from "./config/db";
import { whatsappSessionManager } from "./lib/WhatsAppSessionManager";
import { verifyToken } from "./lib/auth";

import { setSocketUserMap } from "./routes/whatsapp";

dotenv.config();

const app = express();
const httpServer = createServer(app);

/** ✅ Updated frontend URL */
const frontendUrl = "https://sellixs.vercel.app/";

const io = new Server(httpServer, {
    cors: {
        origin: [frontendUrl],
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["polling", "websocket"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
});

/* ───────────────────────────────── ROUTES ───────────────────────────────── */

import { notificationRoutes } from "./routes/notifications";
import { whatsappRoutes } from "./routes/whatsapp";
import messagesRouter from "./routes/messages";
import conversationsRouter from "./routes/conversations";
import { ordersRouter } from "./routes/orders";
import socketsRouter from "./routes/sockets";

/* ───────────────────────────────── CORS ───────────────────────────────── */

app.use(
    cors({
        origin: [frontendUrl],
        credentials: true,
    })
);

app.use(express.json({ limit: "2mb" }));

/* ─────────────────────────────── RATE LIMITING ───────────────────────────── */

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
});

const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." },
});

app.use("/api", generalLimiter);
app.use("/api/whatsapp/init", strictLimiter);
app.use("/api/whatsapp/disconnect", strictLimiter);

/* ───────────────────────────── REGISTER ROUTES ───────────────────────────── */

app.use("/api", notificationRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api", messagesRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/sockets", socketsRouter);
app.use("/api/faqs", require("./routes/faqs").default);

/* ───────────────────────────── HEALTH ENDPOINT ───────────────────────────── */

app.get("/health", (_req: Request, res: Response) => {
    const mem = process.memoryUsage();

    res.json({
        status: "ok",
        service: "whatsapp-worker",
        uptime: Math.floor(process.uptime()),
        memory: {
            heapUsedMB: parseFloat((mem.heapUsed / 1024 / 1024).toFixed(2)),
            heapTotalMB: parseFloat((mem.heapTotal / 1024 / 1024).toFixed(2)),
            rssMB: parseFloat((mem.rss / 1024 / 1024).toFixed(2)),
        },
        activeSessions: whatsappSessionManager.getActiveSessionCount(),
        dbConnected: mongoose.connection.readyState === 1,
        timestamp: new Date().toISOString(),
    });
});

/* ─────────────────────────── KEEP SERVER ALIVE PING ───────────────────────── */

const SELF_URL =
    process.env.SELF_URL || `http://localhost:${process.env.PORT || 3001}`;

setInterval(async () => {
    try {
        const res = await fetch(`${SELF_URL}/health`);
        const data = await res.json();

        console.log("[KeepAlive] Health ping success:", data.status);
    } catch (err) {
        console.error("[KeepAlive] Health ping failed:", err);
    }
}, 3600 * 1000); // 1 hour = 3600 seconds

/* ───────────────────────── WHATSAPP SESSION MANAGER ───────────────────────── */

whatsappSessionManager.setIO(io);

/* ───────────────────────── SOCKET AUTH MIDDLEWARE ───────────────────────── */

let connectionCount = 0;
const maxConnectionsPerMinute = 20;

io.use(async (socket, next) => {
    try {
        connectionCount++;

        setTimeout(() => {
            connectionCount = Math.max(0, connectionCount - 1);
        }, 60000);

        if (connectionCount > maxConnectionsPerMinute) {
            return next(
                new Error("Too many connection attempts. Please try again later.")
            );
        }

        const token = socket.handshake.auth.token;

        if (!token) return next(new Error("Authentication error: No token provided"));

        const decoded = verifyToken(token);

        if (!decoded) return next(new Error("Authentication error: Invalid token"));

        socket.data.user = decoded;

        next();
    } catch {
        next(new Error("Authentication error"));
    }
});

/* ───────────────────────── SOCKET CONNECTION HANDLER ─────────────────────── */

io.on("connection", (socket) => {
    const user = socket.data.user;

    console.log(
        `[Socket] Connected user=${user.userId} business=${user.businessId} id=${socket.id}`
    );

    setSocketUserMap(socket.id, user.userId);

    socket.join(user.businessId);

    socket.on("disconnect", (reason) => {
        console.log(`[Socket] Disconnected id=${socket.id} reason=${reason}`);
    });

    socket.emit("connected", {
        socketId: socket.id,
        userId: user.userId,
        businessId: user.businessId,
        timestamp: new Date(),
    });
});

/* ───────────────────────── GLOBAL ERROR HANDLING ───────────────────────── */

process.on("uncaughtException", (err) => {
    console.error("[FATAL] uncaughtException:", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("[FATAL] unhandledRejection:", reason);
});

/* ───────────────────────── START SERVER ───────────────────────── */

const PORT = process.env.PORT || 3001;

connectDB()
    .then(async () => {
        httpServer.listen(PORT, () => {
            console.log(`[Server] WhatsApp Worker running on port ${PORT}`);
            console.log(`[Server] Frontend URL: ${frontendUrl}`);
        });

        await whatsappSessionManager.restoreAllSessions();
    })
    .catch((error) => {
        console.error("[Server] Failed to connect to database:", error);
        process.exit(1);
    });

/* ───────────────────────── GRACEFUL SHUTDOWN ───────────────────────── */

process.on("SIGTERM", () => {
    console.log("[Server] SIGTERM received. Shutting down gracefully...");
    httpServer.close(() => process.exit(0));
});

process.on("SIGINT", () => {
    console.log("[Server] SIGINT received. Shutting down gracefully...");
    httpServer.close(() => process.exit(0));
});
