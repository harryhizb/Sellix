"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  className?: string;
  variant?: "default" | "stat" | "product" | "order" | "list";
  count?: number;
}

export function SkeletonCard({
  className,
  variant = "default",
  count = 1,
}: SkeletonCardProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case "stat":
        return (
          <div
            className={cn(
              "bg-white rounded-xl border border-slate-200 p-6 shadow-card",
              className
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        );

      case "product":
        return (
          <div
            className={cn(
              "bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card",
              className
            )}
          >
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        );

      case "order":
        return (
          <div
            className={cn(
              "bg-white rounded-xl border border-slate-200 p-4 shadow-card",
              className
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            </div>
          </div>
        );

      case "list":
        return (
          <div className={cn("space-y-3", className)}>
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        );

      default:
        return (
          <div
            className={cn(
              "bg-white rounded-xl border border-slate-200 p-6 shadow-card space-y-4",
              className
            )}
          >
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}
