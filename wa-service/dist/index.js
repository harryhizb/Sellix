"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// wa-service/src/index.ts
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("./config/db");
const WhatsAppSessionManager_1 = require("./lib/WhatsAppSessionManager");
const auth_1 = require("./lib/auth");
// Import the socket user map functions from routes
const whatsapp_1 = require("./routes/whatsapp");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: [frontendUrl, "http://localhost:3000"],
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
const notifications_1 = require("./routes/notifications");
const whatsapp_2 = require("./routes/whatsapp");
const messages_1 = __importDefault(require("./routes/messages"));
const conversations_1 = __importDefault(require("./routes/conversations"));
const orders_1 = require("./routes/orders");
const sockets_1 = __importDefault(require("./routes/sockets"));
// ─── CORS & Body Parsing ──────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: [frontendUrl, "http://localhost:3000"],
    credentials: true,
}));
app.use(express_1.default.json({ limit: "2mb" }));
// ─── Rate Limiting ────────────────────────────────────────────────────────────
/** Strict limiter for sensitive endpoints (WhatsApp init, disconnect) */
const strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
});
/** General API limiter */
const generalLimiter = (0, express_rate_limit_1.default)({
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
app.use("/api", notifications_1.notificationRoutes);
app.use("/api/whatsapp", whatsapp_2.whatsappRoutes);
app.use("/api", messages_1.default);
app.use("/api/conversations", conversations_1.default);
app.use("/api/orders", orders_1.ordersRouter);
app.use("/api/sockets", sockets_1.default);
app.use("/api/faqs", require("./routes/faqs").default);
// ─── Health Endpoint ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
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
        activeSessions: WhatsAppSessionManager_1.whatsappSessionManager.getActiveSessionCount(),
        dbConnected: mongoose_1.default.connection.readyState === 1,
        timestamp: new Date().toISOString(),
    });
});
// ─── Initialize WhatsApp Session Manager with Socket.IO ───────────────────────
WhatsAppSessionManager_1.whatsappSessionManager.setIO(io);
// ─── Socket.IO Auth Middleware ────────────────────────────────────────────────
let connectionCount = 0;
const maxConnectionsPerMinute = 20;
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        connectionCount++;
        setTimeout(() => { connectionCount = Math.max(0, connectionCount - 1); }, 60000);
        if (connectionCount > maxConnectionsPerMinute) {
            console.warn(`[Socket] Too many connections (${connectionCount}), rejecting ${socket.id}`);
            return next(new Error("Too many connection attempts. Please try again later."));
        }
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error("Authentication error: No token provided"));
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded)
            return next(new Error("Authentication error: Invalid token"));
        socket.data.user = decoded;
        next();
    }
    catch (error) {
        next(new Error("Authentication error"));
    }
}));
// ─── Socket.IO Connection Handler ────────────────────────────────────────────
io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`[Socket] Connected user=${user.userId} business=${user.businessId} id=${socket.id}`);
    (0, whatsapp_1.setSocketUserMap)(socket.id, user.userId);
    const rooms = Array.from(socket.rooms);
    if (!rooms.includes(user.businessId)) {
        socket.join(user.businessId);
    }
    socket.on("join-business", (data) => {
        if (user.businessId === data.businessId && !Array.from(socket.rooms).includes(data.businessId)) {
            socket.join(data.businessId);
        }
    });
    socket.on("connect-business", (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (user.businessId !== data.businessId) {
                return socket.emit("error", { message: "Unauthorized access to business", businessId: data.businessId });
            }
            const result = yield WhatsAppSessionManager_1.whatsappSessionManager.initSession(data.businessId);
            if (result.success) {
                socket.emit("connection-update", { businessId: data.businessId, status: "connecting" });
            }
            else {
                socket.emit("error", { message: result.error || "Failed to initialize session", businessId: data.businessId });
            }
        }
        catch (error) {
            socket.emit("error", { message: error instanceof Error ? error.message : "Internal error", businessId: data.businessId });
        }
    }));
    socket.on("disconnect-business", (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (user.businessId !== data.businessId) {
                return socket.emit("error", { message: "Unauthorized access to business", businessId: data.businessId });
            }
            const result = yield WhatsAppSessionManager_1.whatsappSessionManager.disconnect(data.businessId);
            if (result.success) {
                socket.emit("connection-update", { businessId: data.businessId, status: "disconnected" });
            }
            else {
                socket.emit("error", { message: result.error || "Failed to disconnect", businessId: data.businessId });
            }
        }
        catch (error) {
            socket.emit("error", { message: error instanceof Error ? error.message : "Internal error", businessId: data.businessId });
        }
    }));
    socket.on("debug-request-qr", (data) => {
        const qr = WhatsAppSessionManager_1.whatsappSessionManager.getQR(data.businessId);
        if (qr) {
            socket.emit("qr", { businessId: data.businessId, qr, timestamp: new Date() });
        }
        else {
            socket.emit("debug-response", {
                message: "No QR available",
                businessId: data.businessId,
                status: WhatsAppSessionManager_1.whatsappSessionManager.getStatus(data.businessId),
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
(0, db_1.connectDB)()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    httpServer.listen(PORT, () => {
        console.log(`[Server] WhatsApp Worker running on port ${PORT}`);
        console.log(`[Server] Frontend URL: ${frontendUrl}`);
    });
    // ✅ TASK 1: Auto-restore all saved WA sessions from MongoDB after DB is ready
    yield WhatsAppSessionManager_1.whatsappSessionManager.restoreAllSessions();
}))
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
