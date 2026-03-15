// wa-service/src/index.ts
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import { connectDB } from "./config/db";
import { whatsappSessionManager } from "./lib/WhatsAppSessionManager";
import { verifyToken } from "./lib/auth";

// Import the socket user map functions from routes
import { setSocketUserMap } from "./routes/whatsapp";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const frontendUrl = process.env.FRONTEND_URL || "https://sellix-q2ab.vercel.app/";

const io = new Server(httpServer, {
    cors: {
        origin: [frontendUrl, "https://sellix-q2ab.vercel.app/"],
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["polling", "websocket"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
});

// ─── Import routes ────────────────────────────────────────────────────────────
import { notificationRoutes } from "./routes/notifications";
import { whatsappRoutes } from "./routes/whatsapp";
import messagesRouter from "./routes/messages";
import conversationsRouter from "./routes/conversations";
import { ordersRouter } from "./routes/orders";
import socketsRouter from "./routes/sockets";

// ─── CORS & Body Parsing ──────────────────────────────────────────────────────
app.use(
    cors({
        origin: [frontendUrl, "http://localhost:3000"],
        credentials: true,
    })
);
app.use(express.json({ limit: "2mb" }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

/** Strict limiter for sensitive endpoints (WhatsApp init, disconnect) */
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
});

/** General API limiter */
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." },
});

// Apply general limiter to all API routes
app.use("/api", generalLimiter);
// Apply strict limiter to sensitive WA session endpoints
app.use("/api/whatsapp/init", strictLimiter);
app.use("/api/whatsapp/disconnect", strictLimiter);

// ─── Register Routes ──────────────────────────────────────────────────────────
app.use("/api", notificationRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api", messagesRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/sockets", socketsRouter);
app.use("/api/faqs", require("./routes/faqs").default);

// ─── Health Endpoint ──────────────────────────────────────────────────────────
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
        /** ✅ Active WA session count (user requirement) */
        activeSessions: whatsappSessionManager.getActiveSessionCount(),
        dbConnected: mongoose.connection.readyState === 1,
        timestamp: new Date().toISOString(),
    });
});

// ─── Initialize WhatsApp Session Manager with Socket.IO ───────────────────────
whatsappSessionManager.setIO(io);

// ─── Socket.IO Auth Middleware ────────────────────────────────────────────────
let connectionCount = 0;
const maxConnectionsPerMinute = 20;

io.use(async (socket, next) => {
    try {
        connectionCount++;
        setTimeout(() => { connectionCount = Math.max(0, connectionCount - 1); }, 60000);

        if (connectionCount > maxConnectionsPerMinute) {
            console.warn(`[Socket] Too many connections (${connectionCount}), rejecting ${socket.id}`);
            return next(new Error("Too many connection attempts. Please try again later."));
        }

        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error: No token provided"));

        const decoded = verifyToken(token);
        if (!decoded) return next(new Error("Authentication error: Invalid token"));

        socket.data.user = decoded;
        next();
    } catch (error) {
        next(new Error("Authentication error"));
    }
});

// ─── Socket.IO Connection Handler ────────────────────────────────────────────
io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`[Socket] Connected user=${user.userId} business=${user.businessId} id=${socket.id}`);

    setSocketUserMap(socket.id, user.userId);

    const rooms = Array.from(socket.rooms);
    if (!rooms.includes(user.businessId)) {
        socket.join(user.businessId);
    }

    socket.on("join-business", (data: { businessId: string }) => {
        if (user.businessId === data.businessId && !Array.from(socket.rooms).includes(data.businessId)) {
            socket.join(data.businessId);
        }
    });

    socket.on("connect-business", async (data: { businessId: string }) => {
        try {
            if (user.businessId !== data.businessId) {
                return socket.emit("error", { message: "Unauthorized access to business", businessId: data.businessId });
            }
            const result = await whatsappSessionManager.initSession(data.businessId);
            if (result.success) {
                socket.emit("connection-update", { businessId: data.businessId, status: "connecting" });
            } else {
                socket.emit("error", { message: result.error || "Failed to initialize session", businessId: data.businessId });
            }
        } catch (error) {
            socket.emit("error", { message: error instanceof Error ? error.message : "Internal error", businessId: data.businessId });
        }
    });

    socket.on("disconnect-business", async (data: { businessId: string }) => {
        try {
            if (user.businessId !== data.businessId) {
                return socket.emit("error", { message: "Unauthorized access to business", businessId: data.businessId });
            }
            const result = await whatsappSessionManager.disconnect(data.businessId);
            if (result.success) {
                socket.emit("connection-update", { businessId: data.businessId, status: "disconnected" });
            } else {
                socket.emit("error", { message: result.error || "Failed to disconnect", businessId: data.businessId });
            }
        } catch (error) {
            socket.emit("error", { message: error instanceof Error ? error.message : "Internal error", businessId: data.businessId });
        }
    });

    socket.on("debug-request-qr", (data: { businessId: string }) => {
        const qr = whatsappSessionManager.getQR(data.businessId);
        if (qr) {
            socket.emit("qr", { businessId: data.businessId, qr, timestamp: new Date() });
        } else {
            socket.emit("debug-response", {
                message: "No QR available",
                businessId: data.businessId,
                status: whatsappSessionManager.getStatus(data.businessId),
            });
        }
    });

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

// ─── Global Error Handlers (prevent process crash) ───────────────────────────
process.on("uncaughtException", (err) => {
    console.error("[FATAL] uncaughtException:", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("[FATAL] unhandledRejection:", reason);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

connectDB()
    .then(async () => {
        httpServer.listen(PORT, () => {
            console.log(`[Server] WhatsApp Worker running on port ${PORT}`);
            console.log(`[Server] Frontend URL: ${frontendUrl}`);
        });

        // ✅ TASK 1: Auto-restore all saved WA sessions from MongoDB after DB is ready
        await whatsappSessionManager.restoreAllSessions();
    })
    .catch((error) => {
        console.error("[Server] Failed to connect to database:", error);
        process.exit(1);
    });

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
    console.log("[Server] SIGTERM received. Shutting down gracefully...");
    httpServer.close(() => {
        console.log("[Server] HTTP server closed");
        process.exit(0);
    });
});

process.on("SIGINT", () => {
    console.log("[Server] SIGINT received. Shutting down gracefully...");
    httpServer.close(() => {
        console.log("[Server] HTTP server closed");
        process.exit(0);
    });
});