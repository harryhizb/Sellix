"use client";

import React from "react";
import { Reveal } from "./Reveal";

const STATS = [
    { v: "10K+", l: "Orders processed" },
    { v: "98%", l: "Customer satisfaction" },
    { v: "24/7", l: "AI availability" },
    { v: "3×", l: "Average revenue uplift" },
];

export const Stats = React.memo(function Stats() {
    return (
        <section className="py-20" style={{ background: "#080C10" }}>
            <div className="max-w-5xl mx-auto px-6">
                <Reveal>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {STATS.map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="number-gradient" style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                                    {s.v}
                                </div>
                                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: "6px" }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
});
