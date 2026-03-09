"use client";

import React from "react";
import { Reveal } from "./Reveal";
import { Sparkles, Bot, MessageSquare, Zap, Bell, BarChart3, Lock } from "lucide-react";

const FEATURES = [
    {
        icon: Bot,
        title: "AI Sales Agent",
        desc: "A tireless 24/7 rep that qualifies leads, answers FAQs, and closes deals — all on autopilot.",
        accent: "#25D366",
    },
    {
        icon: MessageSquare,
        title: "Smart Cart",
        desc: "Customers order in plain English. The AI extracts intent and builds the cart automatically.",
        accent: "#25D366",
    },
    {
        icon: Zap,
        title: "Auto Discounts",
        desc: "Rule-based coupon engine fires at exactly the right moment to rescue abandoned carts.",
        accent: "#25D366",
    },
    {
        icon: Bell,
        title: "Instant Alerts",
        desc: "Push notifications for every order, refund, or support escalation — never miss a beat.",
        accent: "#25D366",
    },
    {
        icon: BarChart3,
        title: "Deep Analytics",
        desc: "Funnel reports, cohort charts, and revenue attribution that actually make sense.",
        accent: "#25D366",
    },
    {
        icon: Lock,
        title: "Enterprise Security",
        desc: "AES-256 at rest, TLS in transit, zero WhatsApp session storage. Sleep soundly.",
        accent: "#25D366",
    },
];

export const Features = React.memo(function Features() {
    return (
        <section id="features" style={{ padding: "96px 0", background: "#05080D" }}>
            <div className="max-w-6xl mx-auto px-6">
                <Reveal className="text-center mb-16">
                    <div className="tag-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-5" style={{ color: "#25D366" }}>
                        <Sparkles className="w-4 h-4" /> Features
                    </div>
                    <h2
                        style={{
                            fontSize: "clamp(2rem, 4vw, 3rem)",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                            marginBottom: "1rem"
                        }}
                    >
                        Everything you need.<br />
                        <span
                            style={{
                                color: "rgba(255,255,255,0.4)",
                                display: "inline-block",
                                marginTop: "0.6rem"
                            }}
                        >
                            Nothing you don't.
                        </span>
                    </h2>

                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.05rem", maxWidth: "480px", margin: "0 auto" }}>
                        Built for e-commerce operators who want results, not complexity.
                    </p>
                </Reveal>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map((f, i) => (
                        <Reveal key={i} delay={i * 80}>
                            <div className="glass card-hover rounded-2xl p-6 h-full relative overflow-hidden">
                                <div className="shimmer absolute inset-0 rounded-2xl pointer-events-none" />
                                <div style={{
                                    width: "48px", height: "48px", borderRadius: "14px",
                                    background: "rgba(37,211,102,0.1)",
                                    border: "1px solid rgba(37,211,102,0.2)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    marginBottom: "20px",
                                }}>
                                    <f.icon className="w-5 h-5" style={{ color: "#25D366" }} />
                                </div>
                                <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "10px", letterSpacing: "-0.01em" }}>
                                    {f.title}
                                </h3>
                                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", lineHeight: 1.7 }}>
                                    {f.desc}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
});
