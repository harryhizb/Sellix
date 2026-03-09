"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pricing() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section id="pricing" style={{ padding: "96px 0", background: "#05080D" }}>
            <div className="max-w-5xl mx-auto px-6">
                <Reveal className="text-center mb-12">
                    <div className="tag-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-5" style={{ color: "#25D366" }}>
                        Pricing
                    </div>
                    <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
                        Simple, transparent pricing.
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: "32px" }}>Start free. Upgrade when you're ready.</p>

                    {/* Toggle */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                        <span style={{ color: !isYearly ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 500, fontSize: "0.9rem" }}>Monthly</span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="relative w-[52px] h-[28px] rounded-full p-[3px] transition-colors duration-300 focus:outline-none"
                            style={{
                                background: isYearly ? "#25D366" : "rgba(255,255,255,0.1)",
                            }}
                        >
                            <div
                                className={cn(
                                    "w-[22px] h-[22px] rounded-full bg-white shadow-md transition-transform duration-300",
                                    isYearly ? "translate-x-[24px]" : "translate-x-0"
                                )}
                            />
                        </button>
                        <span style={{ color: isYearly ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 500, fontSize: "0.9rem" }}>
                            Yearly{" "}
                            <span style={{ color: "#25D366", fontWeight: 700 }}>−20%</span>
                        </span>
                    </div>
                </Reveal>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Starter */}
                    <Reveal delay={100}>
                        <div className="glass card-hover rounded-2xl p-8 h-full flex flex-col">
                            <div style={{ marginBottom: "6px", fontWeight: 700, fontSize: "1rem" }}>Starter</div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginBottom: "24px" }}>For early-stage stores</div>
                            <div style={{ marginBottom: "28px" }}>
                                <span style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                                    Free
                                </span>
                            </div>
                            <ul style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", flex: 1 }}>
                                {["200 orders/month", "50 products", "Basic analytics", "Email support"].map((f, i) => (
                                    <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>
                                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#25D366" }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="btn-outline text-white font-semibold py-3 rounded-full w-full">
                                Get started
                            </button>
                        </div>
                    </Reveal>

                    {/* Growth — featured */}
                    <Reveal delay={200}>
                        <div style={{
                            background: "linear-gradient(145deg, rgba(37,211,102,0.12), rgba(37,211,102,0.04))",
                            border: "1px solid rgba(37,211,102,0.35)",
                            borderRadius: "1rem", padding: "2rem",
                            position: "relative",
                            boxShadow: "0 0 60px rgba(37,211,102,0.1)",
                        }} className="h-full flex flex-col card-hover">
                            <div style={{
                                position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                                background: "linear-gradient(135deg, #25D366, #1aab52)",
                                color: "#fff", fontWeight: 700, fontSize: "0.75rem",
                                padding: "4px 16px", borderRadius: "999px",
                                boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
                            }}>Most Popular</div>
                            <div style={{ marginBottom: "6px", fontWeight: 700, fontSize: "1rem" }}>Growth</div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginBottom: "24px" }}>For scaling businesses</div>
                            <div style={{ marginBottom: "28px" }}>
                                <span className="number-gradient" style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.03em" }}>${isYearly ? "39" : "49"}</span>
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/mo</span>
                            </div>
                            <ul style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", flex: 1 }}>
                                {["2,000 orders/month", "Unlimited products", "Advanced analytics", "Priority support", "Smart cart recovery"].map((f, i) => (
                                    <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>
                                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#25D366" }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="btn-primary text-white font-semibold py-3 rounded-full w-full">
                                Get started
                            </button>
                        </div>
                    </Reveal>

                    {/* Pro */}
                    <Reveal delay={300}>
                        <div className="glass card-hover rounded-2xl p-8 h-full flex flex-col">
                            <div style={{ marginBottom: "6px", fontWeight: 700, fontSize: "1rem" }}>Pro</div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginBottom: "24px" }}>Enterprise-grade power</div>
                            <div style={{ marginBottom: "28px" }}>
                                <span style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.03em" }}>${isYearly ? "79" : "99"}</span>
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/mo</span>
                            </div>
                            <ul style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", flex: 1 }}>
                                {["Unlimited orders", "Unlimited products", "Full analytics suite", "Dedicated account manager", "Custom AI training"].map((f, i) => (
                                    <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>
                                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#25D366" }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="btn-outline text-white font-semibold py-3 rounded-full w-full">
                                Contact sales
                            </button>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
