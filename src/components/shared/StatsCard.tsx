"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  icon: LucideIcon;
  subtitle?: string;
  loading?: boolean;
  className?: string;
  variant?: "default" | "primary" | "success" | "warning";
}

export function StatsCard({
  title,
  value,
  trend,
  icon: Icon,
  subtitle,
  loading = false,
  className,
  variant = "default",
}: StatsCardProps) {
  const variantStyles = {
    default: {
      iconBg: "bg-[#25D366]/10",
      iconColor: "text-[#25D366]",
    },
    primary: {
      iconBg: "bg-[#25D366]/10",
      iconColor: "text-[#25D366]",
    },
    success: {
      iconBg: "bg-[#25D366]/10",
      iconColor: "text-[#25D366]",
    },
    warning: {
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
  };

  const styles = variantStyles[variant];

  if (loading) {
    return (
      <div
        className={cn(
          "glass rounded-2xl p-6",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-white/10" />
            <Skeleton className="h-8 w-32 bg-white/10" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass rounded-2xl p-6 card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/50">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                  trend.isPositive
                    ? "bg-[#25D366]/10 text-[#25D366]"
                    : "bg-red-500/10 text-red-400"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-white/40">{trend.label}</span>
              )}
            </div>
          )}
          {subtitle && !trend && (
            <p className="text-xs text-white/40">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl",
            styles.iconBg
          )}
        >
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
