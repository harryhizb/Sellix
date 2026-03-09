"use client";

import React from "react";
import { Reveal } from "./Reveal";

const STEPS = [
    { num: "01", title: "Connect WhatsApp", desc: "Scan a QR code. Done. No API approvals, no waiting." },
    { num: "02", title: "Upload Products", desc: "CSV, manual entry, or sync from Shopify in seconds." },
    { num: "03", title: "Go Live", desc: "Your AI sales rep starts chatting, selling, and converting." },
];

export function HowItWorks() {
    return (
        <section id="how" style={{ padding: "96px 0", background: "#080C10" }}>
            <div className="max-w-5xl mx-auto px-6">
                <Reveal className="text-center mb-16">
                    <h2
                        style={{
                            fontSize: "clamp(2rem, 4vw, 3rem)",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            marginBottom: "1rem",
                        }}
                    >
                        Up in{" "}
                        <span className="number-gradient">5 minutes</span>
                        , not 5 weeks.
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.05rem" }}>
                        No developer, no complex API setup. Just scan and sell.
                    </p>
                </Reveal>

                <div className="flex flex-col md:flex-row md:justify-center md:items-stretch gap-6 md:gap-4 relative">
                    {STEPS.map((step, index) => (
                        <React.Fragment key={index}>
                            <Reveal delay={index * 120} className="flex-1">
                                <div className="glass card-hover rounded-2xl p-8 relative text-center h-full">
                                    <div
                                        style={{
                                            fontSize: "3rem",
                                            fontWeight: 800,
                                            background:
                                                "linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.05))",
                                            borderRadius: "50%",
                                            width: "72px",
                                            height: "72px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            margin: "0 auto 20px",
                                            border: "1px solid rgba(37,211,102,0.2)",
                                        }}
                                    >
                                        <span
                                            className="number-gradient"
                                            style={{ fontSize: "1.1rem", fontWeight: 800 }}
                                        >
                                            {step.num}
                                        </span>
                                    </div>
                                    <h3
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "1.1rem",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        {step.title}
                                    </h3>
                                    <p
                                        style={{
                                            color: "rgba(255,255,255,0.45)",
                                            fontSize: "0.9rem",
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        {step.desc}
                                    </p>
                                </div>
                            </Reveal>

                            {index < STEPS.length - 1 && (
                                <div className="hidden md:flex items-center justify-center px-2">
                                    <svg
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        style={{ opacity: 0.6 }}
                                    >
                                        <path
                                            d="M5 12H19M19 12L13 6M19 12L13 18"
                                            stroke="url(#arrow-gradient)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <defs>
                                            <linearGradient
                                                id="arrow-gradient"
                                                x1="5"
                                                y1="12"
                                                x2="19"
                                                y2="12"
                                                gradientUnits="userSpaceOnUse"
                                            >
                                                <stop stopColor="#25D366" />
                                                <stop offset="1" stopColor="#128C7E" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
}
