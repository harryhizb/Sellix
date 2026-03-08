"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "compact";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center",
          className
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-white/30" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/50 max-w-sm">{description}</p>
        {action && (
          <Button
            onClick={action.onClick}
            size="sm"
            className="mt-4 btn-primary text-white rounded-full"
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center glass rounded-2xl border border-dashed border-white/[0.08]",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-white/30" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 max-w-sm mb-6">{description}</p>
      <div className="flex items-center gap-3">
        {action && (
          <Button
            onClick={action.onClick}
            className="btn-primary text-white rounded-full"
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="border-white/[0.08] text-white/70 hover:bg-white/5 hover:text-white rounded-full"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
