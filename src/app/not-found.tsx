import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
            <div className="rounded-full bg-muted p-6 mb-6">
                <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">404</h1>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">Page Not Found</h2>
            <p className="mt-4 max-w-md text-muted-foreground">
                Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
            </p>
            <div className="mt-8 flex gap-4">
                <Button asChild variant="default">
                    <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/">Go Home</Link>
                </Button>
            </div>
        </div>
    );
}
