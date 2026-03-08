"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    /** Custom fallback UI — if omitted, uses the default error card */
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary — catches render errors in the subtree so the whole
 * dashboard doesn't crash. Provides a user-friendly recovery UI.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <ProductsList />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Log to console for server-side log capture
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center glass rounded-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-7 h-7 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-white/50 max-w-sm mb-6">
                        {this.state.error?.message || "An unexpected error occurred in this section."}
                    </p>
                    <Button
                        onClick={this.handleRetry}
                        variant="outline"
                        className="border-white/10 text-white/70 hover:bg-white/5 rounded-full"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

/** Convenience functional wrapper for simple use-cases */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";

    function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    }

    WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
    return WithErrorBoundary;
}
