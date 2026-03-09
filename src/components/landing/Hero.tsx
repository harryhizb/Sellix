"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Star, TrendingUp, Package, Store } from "lucide-react";
import { Reveal } from "./Reveal";

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden grid-bg noise">
            {/* Radial glow blobs */}
            <div style={{
                position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
                width: "900px", height: "600px",
                background: "radial-gradient(ellipse at center, rgba(37,211,102,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute", bottom: "0", right: "-10%",
                width: "500px", height: "500px",
                background: "radial-gradient(ellipse at center, rgba(37,211,102,0.06) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />

            <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    {/* Left */}
                    <div className="space-y-8">
                        <div
                            className="tag-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                            style={{ color: "#25D366" }}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" />
                            </span>
                            AI-powered WhatsApp commerce
                        </div>

                        <h1
                            style={{
                                fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
                                fontWeight: 800,
                                lineHeight: 1.05,
                                letterSpacing: "-0.03em",
                            }}
                        >
                            Sell on WhatsApp{" "}
                            <span className="number-gradient glow-text">24/7</span>
                            <br />
                            <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                                while you sleep.
                            </span>
                        </h1>

                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.1rem", lineHeight: 1.75, maxWidth: "520px" }}>
                            Sellix turns WhatsApp into a fully automated sales machine. Your AI agent answers questions, processes orders, applies discounts, and follows up — all without lifting a finger.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Link href="/signup">
                                <button className="btn-primary text-white font-semibold px-8 py-4 rounded-full flex items-center gap-2 text-base">
                                    Start for free
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                            <button className="btn-outline text-white font-medium px-8 py-4 rounded-full flex items-center gap-2 text-base">
                                <Play className="w-4 h-4 fill-white" />
                                Watch demo
                            </button>
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex -space-x-2">
                                {["#e0c9b1", "#c2d4e8", "#d4c2e8", "#b1e0c9"].map((c, i) => (
                                    <div key={i} className="w-9 h-9 rounded-full border-2 border-[#080C10]"
                                        style={{ background: c }} />
                                ))}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
                                <span style={{ color: "#fff", fontWeight: 600 }}>2,000+</span> businesses trust Sellix
                            </div>
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right — phone mockup */}
                    <div className="relative flex justify-center float">
                        {/* Outer glow ring */}
                        <div style={{
                            position: "absolute", inset: "-40px",
                            background: "radial-gradient(ellipse at center, rgba(37,211,102,0.12) 0%, transparent 70%)",
                            borderRadius: "50%",
                        }} />

                        {/* Phone */}
                        <div style={{
                            background: "linear-gradient(145deg, #1a1f2e, #0d1017)",
                            borderRadius: "3rem",
                            padding: "1rem",
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(37,211,102,0.1)",
                            width: "320px",
                            position: "relative",
                        }}>
                            {/* Notch */}
                            <div style={{
                                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                                width: "80px", height: "20px",
                                background: "#0d1017",
                                borderRadius: "0 0 12px 12px",
                            }} />

                            <div style={{ background: "#fff", borderRadius: "2.2rem", overflow: "hidden" }}>
                                {/* WA header */}
                                <div style={{
                                    background: "linear-gradient(135deg, #25D366, #1aab52)",
                                    padding: "12px 16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}>
                                    <div style={{
                                        width: "36px", height: "36px", borderRadius: "50%",
                                        background: "rgba(255,255,255,0.2)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <Store className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>TechGadgets Store</p>
                                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem" }}>● online</p>
                                    </div>
                                </div>

                                {/* Chat */}
                                <div style={{ background: "#ECE5DD", padding: "16px", minHeight: "340px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {/* User msg */}
                                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                        <div style={{
                                            background: "#DCF8C6", borderRadius: "16px 16px 4px 16px",
                                            padding: "8px 12px", fontSize: "0.8rem", color: "#111", maxWidth: "80%",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                        }}>
                                            Hi! What wireless headphones do you have?
                                        </div>
                                    </div>

                                    {/* Bot reply */}
                                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                        <div style={{
                                            background: "#fff", borderRadius: "16px 16px 16px 4px",
                                            padding: "10px 14px", fontSize: "0.8rem", color: "#111", maxWidth: "88%",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                        }}>
                                            <p style={{ marginBottom: "8px" }}>Hey! 👋 Here's what's hot right now:</p>
                                            <div style={{
                                                background: "#F5F5F5", borderRadius: "10px", padding: "8px",
                                                marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px",
                                            }}>
                                                <div style={{
                                                    width: "40px", height: "40px", background: "#E0E0E0",
                                                    borderRadius: "8px", display: "flex", alignItems: "center",
                                                    justifyContent: "center", fontSize: "1.2rem",
                                                }}>🎧</div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: "0.75rem" }}>ProSound X1 — ANC</p>
                                                    <p style={{ color: "#25D366", fontWeight: 700, fontSize: "0.8rem" }}>$49.99</p>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: "0.72rem", color: "#666" }}>Reply *1* to order instantly ⚡</p>
                                        </div>
                                    </div>

                                    {/* User */}
                                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                        <div style={{
                                            background: "#DCF8C6", borderRadius: "16px 16px 4px 16px",
                                            padding: "8px 12px", fontSize: "0.8rem", color: "#111",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                        }}>
                                            1
                                        </div>
                                    </div>

                                    {/* Confirmation */}
                                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                        <div style={{
                                            background: "#fff", borderRadius: "16px 16px 16px 4px",
                                            padding: "10px 14px", fontSize: "0.8rem",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                        }}>
                                            <p style={{ color: "#25D366", fontWeight: 700, marginBottom: "4px" }}>✅ Order #12345 confirmed!</p>
                                            <p style={{ color: "#555", fontSize: "0.72rem" }}>ProSound X1 • $49.99 • Est. delivery 2–3 days</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating badge — revenue */}
                        <div className="float-slow" style={{
                            position: "absolute", right: "-24px", top: "20%",
                            background: "rgba(10,16,22,0.9)",
                            border: "1px solid rgba(37,211,102,0.25)",
                            borderRadius: "16px", padding: "10px 14px",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            display: "flex", alignItems: "center", gap: "10px",
                        }}>
                            <div style={{
                                width: "36px", height: "36px", borderRadius: "10px",
                                background: "rgba(37,211,102,0.15)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <TrendingUp className="w-4 h-4" style={{ color: "#25D366" }} />
                            </div>
                            <div>
                                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>Today's revenue</p>
                                <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>+$2,840</p>
                            </div>
                        </div>

                        {/* Floating badge — orders */}
                        <div style={{
                            position: "absolute", left: "-28px", bottom: "28%",
                            background: "rgba(10,16,22,0.9)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "16px", padding: "10px 14px",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            display: "flex", alignItems: "center", gap: "10px",
                        }}>
                            <div style={{
                                width: "36px", height: "36px", borderRadius: "10px",
                                background: "rgba(37,211,102,0.1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Package className="w-4 h-4" style={{ color: "#25D366" }} />
                            </div>
                            <div>
                                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>Orders today</p>
                                <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>47 orders</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom fade */}
            <div style={{
                position: "absolute", bottom: 0, insetInline: 0, height: "120px",
                background: "linear-gradient(to bottom, transparent, #080C10)",
                pointerEvents: "none",
            }} />
        </section>
    );
}
