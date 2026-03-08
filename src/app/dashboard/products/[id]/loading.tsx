import { CardSkeleton } from "@/components/shared/SkeletonLoaders";

export default function ProductDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="h-8 w-64 bg-white/5 rounded animate-pulse mb-2" />
        <div className="h-5 w-48 bg-white/5 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CardSkeleton />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <div className="flex gap-3">
            <div className="h-11 w-32 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-11 w-36 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-11 w-36 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}