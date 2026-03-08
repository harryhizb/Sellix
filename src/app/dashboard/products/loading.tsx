import { CardSkeleton } from "@/components/shared/SkeletonLoaders";

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-center mb-8">
                <div className="h-10 bg-muted rounded-md w-1/4"></div>
                <div className="h-10 bg-muted rounded-md w-32"></div>
            </div>

            <div className="h-10 bg-muted rounded-md w-full max-w-sm mb-6"></div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-80 bg-muted rounded-xl"></div>
                ))}
            </div>
        </div>
    );
}
