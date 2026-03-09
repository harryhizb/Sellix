"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";

export function CTA() {
    return (
        <section style={{ padding: "96px 24px", background: "#05080D", position: "relative", overflow: "hidden" }}>
            <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at center, rgba(37,211,102,0.08) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />
            <div className="max-w-3xl mx-auto text-center relative z-10">
                <Reveal>
                    <div className="tag-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ color: "#25D366" }}>
                        <Sparkles className="w-4 h-4" /> Start today — free
                    </div>
                    <h2 style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1.5rem" }}>
                        Your AI sales rep is{" "}
                        <span className="number-gradient">ready to work.</span>
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.1rem", marginBottom: "40px", maxWidth: "480px", margin: "0 auto 40px" }}>
                        Join 2,000+ businesses. 14-day free trial. No credit card needed. Cancel any time.
                    </p>
                    <Link href="/signup">
                        <button className="btn-primary text-white font-bold px-10 py-5 rounded-full text-base flex items-center gap-2 mx-auto green-glow">
                            Start selling for free
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                </Reveal>
            </div>
        </section>
    );
}
