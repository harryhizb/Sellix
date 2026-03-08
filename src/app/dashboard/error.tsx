"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-full w-full items-center justify-center p-6">
            <Card className="max-w-md w-full border-destructive/20 shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-6 w-6" />
                        <CardTitle>Dashboard Error</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        We encountered a problem while loading this section of your dashboard.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto max-h-40">
                            {error.message}
                        </pre>
                    )}
                </CardContent>
                <CardFooter className="flex gap-2 justify-end">
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Reload Page
                    </Button>
                    <Button onClick={() => reset()} variant="default">
                        Try Again
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
