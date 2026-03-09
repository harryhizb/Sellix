"use client";

import Link from "next/link";
import { MessageSquare, Sparkles, TrendingUp, Quote, Shield } from "lucide-react";
import React from "react";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: React.ReactNode;
    subtitle: string;
    tagline?: string;
    testimonial?: {
        quote: string;
        author: string;
        role: string;
        avatar: string;
    };
}

export function AuthLayout({
    children,
    title,
    subtitle,
    tagline = "Now with GPT-4 powered conversations",
    testimonial = {
        quote: "Setup took literally 5 minutes. Now our customers get instant responses at any hour. Best investment we've made.",
        author: "Michael Rodriguez",
        role: "Founder, TechGadgets Store",
        avatar: "MR",
    },
}: AuthLayoutProps) {
    return (
        <div
            style={{ background: "#080C10" }}
            className="min-h-screen text-white flex font-sora overflow-hidden"
        >
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-[#05080D] grid-bg noise">
                <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: "900px", height: "600px", background: "radial-gradient(ellipse at center, rgba(37,211,102,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "0", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(ellipse at center, rgba(37,211,102,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-20 w-full">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center btn-primary">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span style={{ fontWeight: 700, letterSpacing: "-0.02em" }} className="text-xl text-white">Sellix</span>
                    </Link>

                    <div className="space-y-8 max-w-lg">
                        <div className="tag-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#25D366]">
                            <Sparkles className="w-4 h-4" />
                            {tagline}
                        </div>
                        <h1 style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }} className="text-white">
                            {title}
                        </h1>
                        <div className="space-y-4">
                            <div className="glass rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#25D366]/10 border border-[#25D366]/20">
                                    <TrendingUp className="w-6 h-6 text-[#25D366]" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">3x Revenue Growth</p>
                                    <p className="text-white/40 text-sm">Average increase in sales</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                        <Quote className="w-8 h-8 text-[#25D366]/30 mb-3" />
                        <p className="text-white/60 mb-4 leading-relaxed text-sm">
                            &ldquo;{testimonial.quote}&rdquo;
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#1aab52] flex items-center justify-center text-white font-semibold text-sm">{testimonial.avatar}</div>
                            <div>
                                <p className="text-white font-medium text-sm">{testimonial.author}</p>
                                <p className="text-white/40 text-xs">{testimonial.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Content */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
                        <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span style={{ fontWeight: 700, letterSpacing: "-0.02em" }} className="text-xl text-white">Sellix</span>
                    </div>

                    <div className="glass-dark rounded-3xl p-8 relative overflow-hidden">
                        <div className="shimmer absolute inset-0 rounded-3xl pointer-events-none" />
                        <div className="relative z-10">
                            <div className="mb-8">
                                <h2 style={{ fontWeight: 700, letterSpacing: "-0.02em" }} className="text-2xl text-white mb-2">{subtitle}</h2>
                                {children}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
                        <Shield className="h-3.5 w-3.5" />
                        <span>Your WhatsApp sessions are encrypted and secure</span>
                    </div>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1">← Back to Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
