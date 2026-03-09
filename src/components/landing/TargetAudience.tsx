"use client";

import React from "react";
import { Reveal } from "./Reveal";
import { Store, Package, Utensils, GraduationCap, Globe, RefreshCw } from "lucide-react";

const TARGET_AUDIENCES = [
    { icon: Store, label: "Shopify Sellers" },
    { icon: Package, label: "Dropshippers" },
    { icon: Utensils, label: "Restaurants" },
    { icon: GraduationCap, label: "Coaches & Creators" },
    { icon: Globe, label: "Service Businesses" },
    { icon: RefreshCw, label: "Subscription Boxes" },
];

export const TargetAudience = React.memo(function TargetAudience() {
    return (
        <section style={{ padding: "96px 0", background: "#05080D" }}>
            <div className="max-w-5xl mx-auto px-6">
                <Reveal className="text-center mb-12">
                    <h2
                        style={{
                            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            marginBottom: "1rem",
                        }}
                    >
                        Built for every seller
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.05rem" }}>
                        Whatever you sell, wherever you sell it.
                    </p>
                </Reveal>

                {/* Responsive audience tags */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4">
                    {TARGET_AUDIENCES.map((a, i) => (
                        <Reveal key={i} delay={i * 60}>
                            <div
                                className="glass card-hover flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-full cursor-pointer"
                            >
                                <a.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#25D366" }} />
                                <span className="text-sm sm:text-base" style={{ fontWeight: 600 }}>
                                    {a.label}
                                </span>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
});
