"use client";

import React from "react";
import { Reveal } from "./Reveal";
import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
    {
        quote: "This AI has completely transformed how we handle customer inquiries. We're processing 3× more orders with zero extra headcount.",
        author: "Sarah Chen",
        role: "Owner, StyleMart",
        avatar: "SC",
        rating: 5,
    },
    {
        quote: "Setup took literally 5 minutes. Now our customers get instant responses at any hour and our cart abandonment dropped 40%.",
        author: "Michael Rodriguez",
        role: "Founder, TechGadgets",
        avatar: "MR",
        rating: 5,
    },
    {
        quote: "The AI understands context so well — it's like having a dedicated sales rep who never sleeps, never gets tired, never has a bad day.",
        author: "Emma Thompson",
        role: "CEO, Organic Beauty",
        avatar: "ET",
        rating: 5,
    },
];

export const Testimonials = React.memo(function Testimonials() {
    return (
        <section style={{ padding: "96px 0", background: "#080C10" }}>
            <div className="max-w-6xl mx-auto px-6">
                <Reveal className="text-center mb-16">
                    <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
                        Real stores,{" "}
                        <span className="number-gradient">real results.</span>
                    </h2>
                </Reveal>
                <div className="grid md:grid-cols-3 gap-6">
                    {TESTIMONIALS.map((t, i) => (
                        <Reveal key={i} delay={i * 100}>
                            <div className="glass card-hover rounded-2xl p-7 flex flex-col h-full relative overflow-hidden">
                                <div className="shimmer absolute inset-0 rounded-2xl pointer-events-none" />
                                <Quote className="w-8 h-8 mb-5 relative z-10" style={{ color: "rgba(37,211,102,0.3)" }} />
                                <p className="relative z-10" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: "0.9rem", flex: 1, marginBottom: "24px" }}>
                                    "{t.quote}"
                                </p>
                                <div className="relative z-10" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{
                                        width: "42px", height: "42px", borderRadius: "50%",
                                        background: "linear-gradient(135deg, #25D366, #1aab52)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontWeight: 700, fontSize: "0.8rem", color: "#fff",
                                    }}>
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.author}</p>
                                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>{t.role}</p>
                                    </div>
                                </div>
                                <div className="relative z-10" style={{ display: "flex", gap: "3px", marginTop: "16px" }}>
                                    {[...Array(t.rating)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
});
