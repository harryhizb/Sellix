import { CardSkeleton } from "@/components/shared/SkeletonLoaders";

export default function ScheduleLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-muted rounded-md w-1/4 mb-2"></div>
            <div className="h-4 bg-muted rounded-md w-1/3 mb-8"></div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="h-64 bg-muted rounded-xl"></div>
                </div>
                <div className="space-y-4">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        </div>
    );
}
