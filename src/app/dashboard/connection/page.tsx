"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  RefreshCw,
  Smartphone,
  AlertCircle,
  Wifi,
  WifiOff,
  Clock,
  Power,
  MessageCircle,
  Link2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConnectionPage() {
  const {
    socket,
    isConnected,
    qrCode,
    showQRCode,
    connectionStatus,
    connectToBusiness,
    disconnectFromBusiness,
    currentBusiness,
    clearQRCode,
    regenerateQR,
    refreshConnectionStatus
  } = useSocket();

  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");

  const businessIdRef = useRef<string | null>(null);
  const hasConnectedRef = useRef(false);

  const status = connectionStatus?.status || "disconnected";

  useEffect(() => {
    if (!connectionStatus) {
      setConnectionMessage("Ready to connect your WhatsApp account.");
      return;
    }

    switch (connectionStatus.status) {
      case "connected":
        setConnectionMessage("Your WhatsApp is connected and ready to automate sales.");
        break;
      case "qr_ready":
        setConnectionMessage("Scan the QR code with your WhatsApp to connect.");
        break;
      case "connecting":
        setConnectionMessage("Establishing connection to WhatsApp...");
        break;
      case "disconnected":
        setConnectionMessage(connectionStatus.reason || "Disconnected from WhatsApp.");
        break;
      case "error":
        setConnectionMessage("Connection error. Please try again.");
        break;
      default:
        setConnectionMessage(connectionStatus.message || "Ready to connect.");
    }
  }, [connectionStatus]);

  // Fetch current WhatsApp status on page load and periodically
  useEffect(() => {
    refreshConnectionStatus();

    // Auto-refresh every 10 seconds to catch backend state changes
    const interval = setInterval(refreshConnectionStatus, 10000);

    return () => clearInterval(interval);
  }, [refreshConnectionStatus]);

  useEffect(() => {
    if (!isConnected || !socket || !currentBusiness) return;
    const businessId = currentBusiness._id;

    console.log(`[CONNECTION PAGE] Socket connected, business: ${businessId}, hasConnected: ${hasConnectedRef.current}`);

    if (hasConnectedRef.current && businessIdRef.current === businessId) {
      console.log(`[CONNECTION PAGE] Already connected to this business, skipping`);
      return;
    }

    // If WhatsApp is already fully connected, skip sending the connect command.
    if (connectionStatus?.status === "connected") {
      console.log(`[CONNECTION PAGE] WhatsApp is already connected globally, skipping redundant connect request!`);
      businessIdRef.current = businessId;
      hasConnectedRef.current = true;
      return;
    }

    businessIdRef.current = businessId;
    hasConnectedRef.current = true;
    clearQRCode();

    console.log(`[CONNECTION PAGE] Connecting to business ${businessId} in 500ms...`);
    const timeout = setTimeout(() => connectToBusiness(businessId), 500);
    return () => clearTimeout(timeout);
  }, [isConnected, socket, currentBusiness, connectToBusiness, clearQRCode]);

  useEffect(() => () => {
    businessIdRef.current = null;
    hasConnectedRef.current = false;
  }, []);

  const handleConnect = useCallback(() => {
    if (!token || !currentBusiness?._id) {
      alert("Please login to connect WhatsApp");
      return;
    }

    setLoading(true);
    clearQRCode();
    businessIdRef.current = currentBusiness._id;
    hasConnectedRef.current = false;

    connectToBusiness(currentBusiness._id);
    setLoading(false);
  }, [token, currentBusiness, connectToBusiness, clearQRCode]);

  const handleDisconnect = useCallback(() => {
    if (!token || !currentBusiness?._id) return;

    setLoading(true);
    disconnectFromBusiness(currentBusiness._id);
    businessIdRef.current = null;
    hasConnectedRef.current = false;
    setLoading(false);
  }, [token, currentBusiness, disconnectFromBusiness]);

  const handleRegenerate = useCallback(() => {
    if (!currentBusiness?._id) return;
    setLoading(true);
    regenerateQR(currentBusiness._id);
    setLoading(false);
  }, [currentBusiness, regenerateQR]);

  const showQR = showQRCode && qrCode;
  const isConnecting = loading || status === "connecting";
  const canConnect = isConnected && currentBusiness && status !== "connected";

  // Debug: Log current state
  useEffect(() => {
    console.log(`[CONNECTION PAGE] State:`, {
      status,
      connectionStatus: connectionStatus?.status,
      isConnected,
      hasBusiness: !!currentBusiness,
      businessId: currentBusiness?._id,
      qrCode: !!qrCode,
      showQRCode
    });
  }, [status, connectionStatus, isConnected, currentBusiness, qrCode, showQRCode]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          WhatsApp Connection
        </h1>
        <p className="mt-1.5 text-white/50 text-sm">
          Connect your WhatsApp account to start automating sales
        </p>
      </div>

      {/* Status Cards Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatusCard
          title="Connection Status"
          status={status}
          icon={status === "connected" ? Wifi : WifiOff}
        />
        <StatusCard
          title="Session Uptime"
          value={status === "connected" ? "2h 34m" : "--"}
          icon={Clock}
          status={status === "connected" ? "connected" : "disconnected"}
        />
        <StatusCard
          title="Messages Today"
          value="128"
          subvalue="+12% vs yesterday"
          icon={MessageCircle}
          status="connected"
        />
      </div>

      {/* Main Connection Card */}
      <div className="glass rounded-3xl p-8 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#25D366]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="max-w-lg mx-auto text-center relative">
          {/* Status Badge */}
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6",
            status === "connected" && "tag-pill text-[#25D366]",
            status === "qr_ready" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
            status === "connecting" && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
            status === "disconnected" && "bg-red-500/10 text-red-400 border border-red-500/20"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              status === "connected" && "bg-[#25D366] animate-pulse",
              status === "qr_ready" && "bg-amber-400",
              status === "connecting" && "bg-blue-400 animate-pulse",
              status === "disconnected" && "bg-red-400"
            )} />
            {status === "connected" ? "Connected" :
              status === "qr_ready" ? "Waiting for QR Scan" :
                status === "connecting" ? "Connecting..." : "Disconnected"}
          </div>

          {/* Connection Message */}
          <p className="text-white/50 mb-8">{connectionMessage}</p>

          {/* QR Code or Status Icon */}
          <div className="mb-8">
            {status === "connected" ? (
              <div className="w-32 h-32 mx-auto rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center mb-4 green-glow">
                <CheckCircle2 className="w-16 h-16 text-[#25D366]" />
              </div>
            ) : showQR ? (
              <div className="space-y-4">
                <div className="inline-block p-6 bg-white rounded-2xl">
                  <QRCodeSVG value={qrCode} size={240} />
                </div>
                <p className="text-sm text-white/40">
                  Open WhatsApp → Settings → Linked Devices → Link a Device
                </p>
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center">
                {isConnecting ? (
                  <RefreshCw className="w-12 h-12 text-white/30 animate-spin" />
                ) : (
                  <Smartphone className="w-12 h-12 text-white/20" />
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {status !== "connected" ? (
              <>
                <Button
                  onClick={showQR ? handleRegenerate : handleConnect}
                  className="h-12 px-8 btn-primary text-white font-semibold rounded-full"
                  disabled={!canConnect || isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : showQR ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate QR Code
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      Connect WhatsApp
                    </>
                  )}
                </Button>

                {showQR && (
                  <p className="text-xs text-white/40">
                    QR code expires in 60 seconds
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="h-12 px-8 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-full"
                >
                  <Power className="mr-2 h-4 w-4" />
                  {loading ? "Disconnecting..." : "Disconnect"}
                </Button>

                <div>
                  <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="text-sm text-white/40 hover:text-white/70 underline underline-offset-4 transition-colors"
                  >
                    Connect a different WhatsApp account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-[#25D366]" />
            </div>
            How to connect
          </h3>
          <ol className="space-y-3 text-sm text-white/50">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
              Open WhatsApp on your phone
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
              Go to Settings → Linked Devices
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
              Tap &quot;Link a Device&quot; and scan the QR code
            </li>
          </ol>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white/50" />
            </div>
            Having trouble?
          </h3>
          <ul className="space-y-2 text-sm text-white/50">
            <li className="flex items-start gap-2">
              <span className="text-[#25D366] mt-1">•</span>
              Make sure your phone has internet connection
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#25D366] mt-1">•</span>
              Keep WhatsApp open while scanning
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#25D366] mt-1">•</span>
              Try regenerating the QR code if it expires
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface StatusCardProps {
  title: string;
  value?: string;
  subvalue?: string;
  status: string;
  icon: React.ElementType;
}

function StatusCard({ title, value, subvalue, status, icon: Icon }: StatusCardProps) {
  const isConnected = status === "connected";

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          isConnected ? "bg-[#25D366]/10" : "bg-white/5"
        )}>
          <Icon className={cn("w-5 h-5", isConnected ? "text-[#25D366]" : "text-white/40")} />
        </div>
        {isConnected && (
          <span className="flex items-center gap-1 text-xs text-[#25D366]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
            Live
          </span>
        )}
      </div>
      <p className="text-xs text-white/40 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white font-mono">{value || "--"}</p>
      {subvalue && <p className="text-xs text-[#25D366] mt-1">{subvalue}</p>}
    </div>
  );
}
