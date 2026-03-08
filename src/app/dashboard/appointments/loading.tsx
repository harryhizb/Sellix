import { CardSkeleton } from "@/components/shared/SkeletonLoaders";

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-center mb-8">
                <div className="h-10 bg-muted rounded-md w-1/4"></div>
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 bg-muted rounded-md w-20"></div>
                    ))}
                </div>
            </div>
            <div className="grid gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
