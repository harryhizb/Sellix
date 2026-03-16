"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: any; // Accept LucideIcon or ReactNode
  title: string;
  description: string;
  action?: any; // Accept action object or ReactNode
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "compact";
}

export function EmptyState({
  icon: iconProp,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = "default",
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!iconProp) return null;
    if (typeof iconProp === 'function' || (typeof iconProp === 'object' && '$$typeof' in iconProp)) {
      const Icon = iconProp;
      return <Icon className={variant === "compact" ? "w-6 h-6 text-white/30" : "w-8 h-8 text-white/30"} />;
    }
    return iconProp;
  };

  const renderAction = () => {
    if (!action) return null;
    if (typeof action === 'object' && 'label' in action && 'onClick' in action) {
      return (
        <Button
          onClick={action.onClick}
          size={variant === "compact" ? "sm" : "default"}
          className={cn("btn-primary text-white rounded-full", variant === "compact" ? "mt-4" : "")}
        >
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      );
    }
    return action;
  };

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center",
          className
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
          {renderIcon()}
        </div>
        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/50 max-w-sm">{description}</p>
        {renderAction()}
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
        {renderIcon()}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 max-w-sm mb-6">{description}</p>
      <div className="flex items-center gap-3">
        {renderAction()}
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
