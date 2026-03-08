"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
import { RefreshCw, Search, Bot, Hand, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Takeover {
  _id: string;
  customerId: { _id: string; name: string; phone: string } | string;
  pausedAt?: string;
  createdAt?: string;
  reason?: string;
  isActive: boolean;
}

export default function ChatPage() {
  const { token, user } = useAuth();
  const { socket, connectionStatus } = useSocket();

  const [takeovers, setTakeovers] = useState<Takeover[]>([]);
  const [search, setSearch] = useState("");
  const [handing, setHanding] = useState(false);

  const isWhatsAppConnected = connectionStatus?.status === "connected";

  const fetchTakeovers = useCallback(async () => {
    if (!token || !user?.businessId) return;
    try {
      const r = await fetch(`/api/conversations/takeover/active?businessId=${user.businessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.takeovers) setTakeovers(d.takeovers);
    } catch { }
  }, [token, user?.businessId]);

  useEffect(() => {
    fetchTakeovers();
  }, [fetchTakeovers]);

  useEffect(() => {
    if (!socket) return;
    socket.on("takeover-started", () => { 
      fetchTakeovers(); 
    });
    socket.on("takeover-ended", () => { 
      fetchTakeovers(); 
    });
    return () => { 
      socket.off("takeover-started"); 
      socket.off("takeover-ended"); 
    };
  }, [socket, fetchTakeovers]);

  const handbackToAI = async (customerId: string, customerName: string) => {
    if (!user?.businessId) return;
    
    if (!confirm(`Hand back ${customerName} to AI? The AI will resume handling this conversation.`)) {
      return;
    }
    
    setHanding(true);
    try {
      const r = await fetch("/api/conversations/takeover/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          customerId: customerId, 
          businessId: user.businessId,
          summary: "Resolved by owner - handed back to AI" 
        }),
      });
      
      if (r.ok) {
        // Remove from takeovers list
        setTakeovers(prev => prev.filter(t => {
          const tid = typeof t.customerId === "string" ? t.customerId : t.customerId?._id;
          return tid !== customerId;
        }));
      } else {
        const error = await r.json();
        alert(`Failed to hand back: ${error.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Handback error:", e);
      alert("Network error. Please try again.");
    }
    setHanding(false);
  };

  const takeoverCustomer = (t: Takeover) => {
    if (typeof t.customerId === "string") return { id: t.customerId, name: "Customer", phone: "" };
    return { id: t.customerId._id, name: t.customerId.name || "Customer", phone: t.customerId.phone || "" };
  };

  const filteredTakeovers = takeovers.filter(t => {
    const c = takeoverCustomer(t);
    const searchLower = search.toLowerCase();
    return c.name.toLowerCase().includes(searchLower) || 
           c.phone.includes(searchLower) ||
           (t.reason && t.reason.toLowerCase().includes(searchLower));
  });

  return (
    <div className="h-[calc(100vh-4rem)] -mx-6 -my-6 flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-white/[0.06] glass-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Customer Support Requests</h1>
              <p className="text-xs text-white/40 mt-0.5">Manage customers who requested human assistance</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchTakeovers}
              className="text-white/40 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, or reason..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366]/50 transition-colors"
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-4 lg:px-6 py-3 border-b border-white/[0.06] glass-dark flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
              <Hand className="w-4 h-4 text-[#25D366]" />
            </div>
            <div>
              <p className="text-xs text-white/50">Active Requests</p>
              <p className="text-sm font-semibold text-white">{filteredTakeovers.length}</p>
            </div>
          </div>
          {!isWhatsAppConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-sm border border-red-500/20 ml-auto">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              WhatsApp Disconnected
            </div>
          )}
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {filteredTakeovers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40">
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-white/20" />
              </div>
              <p className="text-lg font-semibold text-white/60 mb-2">
                {search ? "No matching requests found" : "No active support requests"}
              </p>
              <p className="text-sm text-center max-w-md">
                {search 
                  ? "Try adjusting your search terms" 
                  : "All customers are currently being assisted by AI. When someone requests human support, they'll appear here."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 max-w-5xl mx-auto">
              {filteredTakeovers.map(t => {
                const c = takeoverCustomer(t);
                return (
                  <div
                    key={t._id}
                    className="glass-dark border border-white/[0.06] rounded-2xl p-4 lg:p-5 hover:border-white/[0.1] transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold text-lg">
                          {c.name[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#25D366] rounded-full border-2 border-[#080C10] flex items-center justify-center">
                          <Hand className="w-2.5 h-2.5 text-[#080C10]" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-white truncate">{c.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-white/50">
                              <Phone className="w-3 h-3" />
                              <span>{c.phone}</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handbackToAI(c.id, c.name)}
                            disabled={handing || !isWhatsAppConnected}
                            variant="outline"
                            className="flex-shrink-0 border-white/[0.08] text-white/70 hover:bg-white/5 hover:text-white rounded-full px-4 h-9"
                          >
                            <Bot className="w-4 h-4 mr-2" />
                            {handing ? "Processing..." : "Hand to AI"}
                          </Button>
                        </div>

                        {/* Reason */}
                        {t.reason ? (
                          <div className="mt-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-amber-400 mb-0.5">Reason for Support</p>
                                <p className="text-sm text-white/80 leading-relaxed">{t.reason}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 p-3 bg-[#25D366]/5 border border-[#25D366]/20 rounded-xl">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                              <p className="text-sm text-[#25D366] font-medium">Waiting for reason</p>
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-2 mt-3 text-xs text-white/40">
                          <span>Requested at:</span>
                          <span className="font-medium">
                            {new Date(t.pausedAt || t.createdAt || "").toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
