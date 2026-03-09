"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
    {
        q: "Is this the official WhatsApp Business API?",
        a: "No. We use WhatsApp Web technology to connect to your existing number — no Meta approval needed, no 30-day wait. You get all the automation benefits immediately.",
    },
    {
        q: "How long does setup really take?",
        a: "Under 5 minutes for most stores. Scan QR → upload products → set your policies → done. The AI learns your catalog instantly.",
    },
    {
        q: "Can I customize how the AI talks?",
        a: "Absolutely. You control tone, product descriptions, discount rules, shipping policies, and even specific scripts for common scenarios.",
    },
    {
        q: "Is my data safe?",
        a: "Yes. AES-256 encryption at rest, TLS 1.3 in transit, and we never store your WhatsApp session on our servers. You can wipe everything in one click.",
    },
    {
        q: "What happens if the AI can't answer something?",
        a: "It gracefully escalates to you with full conversation context. You step in, answer, and optionally train the AI so it handles it next time.",
    },
];

export function FAQ() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <section id="faq" style={{ padding: "96px 0", background: "#080C10" }}>
            <div className="max-w-2xl mx-auto px-6">
                <Reveal className="text-center mb-12">
                    <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                        Questions?
                    </h2>
                </Reveal>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {FAQS.map((f, i) => {
                        const isOpen = openFaq === i;
                        return (
                            <Reveal key={i} delay={i * 50}>
                                <div
                                    className={cn(
                                        "glass rounded-2xl overflow-hidden transition-all duration-300",
                                        isOpen ? "border-[#25D366]/25 ring-1 ring-[#25D366]/10" : "border-white/5"
                                    )}
                                >
                                    <button
                                        onClick={() => setOpenFaq(isOpen ? null : i)}
                                        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/03"
                                    >
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{f.q}</span>
                                        <ChevronDown
                                            className={cn(
                                                "w-5 h-5 transition-transform duration-500",
                                                isOpen ? "rotate-180 text-[#25D366]" : "text-white/40"
                                            )}
                                        />
                                    </button>
                                    <div
                                        className={cn(
                                            "grid transition-all duration-500 ease-in-out",
                                            isOpen ? "grid-rows-[1fr] opacity-100 mb-5" : "grid-rows-[0fr] opacity-0"
                                        )}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="px-5 text-white/50 text-[0.875rem] leading-relaxed">
                                                {f.a}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
