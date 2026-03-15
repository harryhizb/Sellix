"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { clientEnv } from "@/lib/client-env";

interface Business {
    _id: string;
    name: string;
    whatsappPhone?: string;
}

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    status: string;
    qrCode: string | null;
    showQRCode: boolean;
    connectionStatus: {
        businessId: string;
        status: string;
        qr?: string;
        reason?: string;
        message?: string;
    } | null;
    currentBusiness: Business | null;
    clearQRCode: () => void;
    connectToBusiness: (businessId: string) => void;
    disconnectFromBusiness: (businessId: string) => void;
    regenerateQR: (businessId: string) => void;
    checkPhoneAvailability: (businessId: string, phoneNumber: string) => Promise<{
        available: boolean;
        registeredTo?: string;
        registeredAt?: Date;
    }>;
    refreshBusiness: () => Promise<void>;
    refreshConnectionStatus: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { token, user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState("disconnected");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [showQRCode, setShowQRCode] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<SocketContextType["connectionStatus"]>(null);
    const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const qrProcessedRef = useRef<boolean>(false);
    const currentBusinessIdRef = useRef<string | null>(null);
    const hasEmittedConnectRef = useRef<boolean>(false);

    // Fetch business data
    const fetchBusiness = useCallback(async () => {
        if (!token) return;

        try {
            const response = await fetch("/api/business", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentBusiness(data.business);
                currentBusinessIdRef.current = data.business?._id || null;
            } else {
                setCurrentBusiness(null);
                currentBusinessIdRef.current = null;
            }
        } catch {
            setCurrentBusiness(null);
            currentBusinessIdRef.current = null;
        }
    }, [token]);

    const refreshBusiness = useCallback(async () => fetchBusiness(), [fetchBusiness]);

    useEffect(() => {
        if (token && user?.businessId) fetchBusiness();
    }, [token, user?.businessId, fetchBusiness]);

    const clearQRCode = useCallback(() => {
        setQrCode(null);
        setShowQRCode(false);
        lastQrCodeRef.current = null;
        qrProcessedRef.current = false;
        if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
        qrTimeoutRef.current = null;
    }, []);

    const connectToBusiness = useCallback((businessId: string) => {
        if (!socketRef.current?.connected) return;

        if (hasEmittedConnectRef.current && currentBusinessIdRef.current === businessId) return;

        hasEmittedConnectRef.current = true;
        currentBusinessIdRef.current = businessId;
        qrProcessedRef.current = false;
        socketRef.current.emit("connect-business", { businessId });
    }, []);

    const disconnectFromBusiness = useCallback((businessId: string) => {
        if (!socketRef.current?.connected) return;
        hasEmittedConnectRef.current = false;
        clearQRCode();
        socketRef.current.emit("disconnect-business", { businessId });
    }, [clearQRCode]);

    const regenerateQR = useCallback((businessId: string) => {
        if (!socketRef.current?.connected) return;

        console.log(`[SOCKET] Regenerating QR code for ${businessId}`);
        // 1. Force disconnect to clear backend state/files
        socketRef.current.emit("disconnect-business", { businessId });

        // 2. Clear local state
        clearQRCode();
        hasEmittedConnectRef.current = false;
        qrProcessedRef.current = false;

        // 3. Re-initiate connection after a short delay
        setTimeout(() => {
            console.log(`[SOCKET] Re-connecting for fresh QR`);
            connectToBusiness(businessId);
        }, 1000);
    }, [clearQRCode, connectToBusiness]);

    const lastQrCodeRef = useRef<string | null>(null);

    const checkPhoneAvailability = useCallback(
        async (
            businessId: string,
            phoneNumber: string
        ): Promise<{ available: boolean; registeredTo?: string; registeredAt?: Date }> => {
            if (!socketRef.current || !socketRef.current.connected) {
                console.error("Socket not connected. Cannot check phone availability.");
                return { available: false, registeredTo: undefined, registeredAt: undefined };
            }

            return new Promise((resolve) => {
                socketRef.current!.emit(
                    "check-phone-availability",
                    { businessId, phoneNumber },
                    (response: { available: boolean; registeredTo?: string; registeredAt?: Date }) => {
                        resolve(response);
                    }
                );
            });
        },
        []
    );

    const handleQRCode = useCallback((data: { businessId: string; qr: string }) => {
        console.log(`[SOCKET] Received QR code for ${data.businessId}`);
        // Only skip if it's the SAME QR code string
        if (lastQrCodeRef.current === data.qr && qrProcessedRef.current && currentBusinessIdRef.current === data.businessId) {
            return;
        }

        if (currentBusinessIdRef.current !== data.businessId) {
            console.warn(`[SOCKET] QR businessId mismatch: ${data.businessId} vs ${currentBusinessIdRef.current}`);
            return;
        }

        lastQrCodeRef.current = data.qr;
        setQrCode(data.qr);
        setShowQRCode(true);
        qrProcessedRef.current = true;

        if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
        qrTimeoutRef.current = setTimeout(() => {
            console.log(`[SOCKET] QR code timed out`);
            clearQRCode();
            hasEmittedConnectRef.current = false;
        }, 5 * 60 * 1000);
    }, [clearQRCode]);

    const handleQRCodeClear = useCallback(() => {
        clearQRCode();
        hasEmittedConnectRef.current = false;
    }, [clearQRCode]);

    const handleConnectionUpdate = useCallback((data: {
        businessId: string;
        status: string;
        qr?: string;
        reason?: string;
        message?: string;
    }) => {
        console.log(`[SOCKET] Connection update:`, data);
        setConnectionStatus(data);

        if (data.status === "connected") {
            clearQRCode();
            hasEmittedConnectRef.current = false;
            qrProcessedRef.current = false;
        } else if (data.status === "qr_ready" && data.qr) {
            handleQRCode({ businessId: data.businessId, qr: data.qr });
        } else if (data.status === "connecting") {
            // Keep state mostly as is, but allowed to reset if needed
        } else {
            hasEmittedConnectRef.current = false;
            qrProcessedRef.current = false;
        }
    }, [clearQRCode, handleQRCode]);

    const handleTakeoverEvent = useCallback((event: string, data: any) => {
        console.log(`Takeover event: ${event}`, data);
    }, []);

    const handleSessionError = useCallback((data: { businessId: string; error: string }) => {
        console.error("Session error:", data);
        if (currentBusiness?._id === data.businessId) {
            hasEmittedConnectRef.current = false;
            qrProcessedRef.current = false;
            alert(`WhatsApp session error: ${data.error}`);
        }
    }, [currentBusiness]);

    const setupSocketListeners = useCallback((socketInstance: Socket) => {
        socketInstance.on("qr", handleQRCode);
        socketInstance.on("qr-clear", handleQRCodeClear);
        socketInstance.on("connection-update", handleConnectionUpdate);
        socketInstance.on("takeover-started", (d) => handleTakeoverEvent("takeover-started", d));
        socketInstance.on("takeover-ended", (d) => handleTakeoverEvent("takeover-ended", d));
        socketInstance.on("customer-message", (d) => handleTakeoverEvent("customer-message", d));
        socketInstance.on("error", (err) => console.error("Socket error:", err));
        socketInstance.on("phone-conflict", (d) => alert(`Phone conflict: ${d.message}`));
        socketInstance.on("session-error", handleSessionError);
    }, [handleQRCode, handleQRCodeClear, handleConnectionUpdate, handleTakeoverEvent, handleSessionError]);

    useEffect(() => {
        if (!token) return;

        const baseUrl = clientEnv.WA_SERVICE_URL.replace(/\/+$/, '');
        const socketInstance = io(baseUrl, {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ["websocket", "polling"],
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);
        hasEmittedConnectRef.current = false;
        qrProcessedRef.current = false;

        socketInstance.on("connect", () => {
            setIsConnected(true);
            setStatus("connected");
            if (currentBusinessIdRef.current) {
                socketInstance.emit("join-business", { businessId: currentBusinessIdRef.current });
            }
        });

        socketInstance.on("connect_error", () => setIsConnected(false));
        socketInstance.on("disconnect", () => {
            setIsConnected(false);
            hasEmittedConnectRef.current = false;
            qrProcessedRef.current = false;
        });

        setupSocketListeners(socketInstance);

        return () => {
            socketInstance.removeAllListeners();
            socketInstance.disconnect();
            clearQRCode();
        };
    }, [token, setupSocketListeners, clearQRCode]);

    useEffect(() => {
        if (socket?.connected && currentBusiness?._id) {
            socket.emit("join-business", { businessId: currentBusiness._id });
        }
    }, [socket, currentBusiness?._id]);

    const refreshConnectionStatus = useCallback(async () => {
        if (!token || !currentBusiness?._id) return;
        try {
            const baseUrl = clientEnv.WA_SERVICE_URL.replace(/\/+$/, '');
            const response = await fetch(`${baseUrl}/api/whatsapp/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    // Update both connectionStatus AND local status to stay in sync
                    setStatus(data.status || "disconnected");
                    setConnectionStatus({
                        businessId: currentBusiness._id,
                        status: data.status,
                        qr: data.qr,
                        message: data.status === "connected" ? "Connected" : "Disconnected"
                    });
                    console.log(`[SOCKET] Refreshed status from API: ${data.status}`);
                } catch (parseError) {
                    console.error("[SOCKET] Failed to parse status response:", text.substring(0, 100));
                }
            }
        } catch (error) {
            console.error("Failed to refresh connection status:", error);
        }
    }, [token, currentBusiness?._id]);

    useEffect(() => {
        refreshConnectionStatus();
    }, [refreshConnectionStatus]);

    const contextValue = useMemo(() => ({
        socket,
        isConnected,
        status,
        qrCode,
        showQRCode,
        connectionStatus,
        currentBusiness,
        clearQRCode,
        connectToBusiness,
        disconnectFromBusiness,
        regenerateQR,
        checkPhoneAvailability,
        refreshBusiness,
        refreshConnectionStatus
    }), [socket, isConnected, status, qrCode, showQRCode, connectionStatus, currentBusiness, clearQRCode, connectToBusiness, disconnectFromBusiness, regenerateQR, checkPhoneAvailability, refreshBusiness, refreshConnectionStatus]);

    return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useSocket must be used within a SocketProvider");
    return context;
}
