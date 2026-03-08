"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 pb-4 border-b border-white/[0.06]", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-white/40 mb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-white/70 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only">Home</span>
          </Link>
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-white/20" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-white/70 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-white font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-white/50 text-sm max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
