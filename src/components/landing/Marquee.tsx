"use client";

import React from "react";

const BUSINESS_NAMES = [
    "StyleMart", "TechGadgets", "Organic Beauty", "Fresh Bites",
    "Urban Fitness", "Craft Corner", "Home Comfort", "Gadget World",
    "Sweet Treats", "Auto Parts Pro", "Fashion Forward", "Pet Paradise",
];

export const Marquee = React.memo(function Marquee() {
    return (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", padding: "20px 0", overflow: "hidden" }}>
            <div className="flex">
                <div className="marquee flex gap-12 whitespace-nowrap">
                    {BUSINESS_NAMES.concat(BUSINESS_NAMES).map((n, i) => (
                        <span key={i} style={{ color: "rgba(255,255,255,0.25)", fontWeight: 500, fontSize: "0.85rem" }}>
                            {n}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
});
