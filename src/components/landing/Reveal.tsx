"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
    children: React.ReactNode;
    delay?: number;
    className?: string;
    threshold?: number;
}

export function Reveal({
    children,
    delay = 0,
    className,
    threshold = 0.15,
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);

    return (
        <div
            ref={ref}
            className={cn(
                "transition-all duration-700 ease-out will-change-[transform,opacity]",
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                className
            )}
            style={{
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}
