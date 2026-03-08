"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface DashboardGuardProps {
    children: (capabilities: any, businessName: string, businessId: string) => React.ReactNode;
}

/**
 * DashboardGuard - Strict Onboarding Gate
 * 
 * Enforces the following flow:
 * 1. Wait for client-side mount (avoids hydration mismatch)
 * 2. If no user → redirect to login
 * 3. If user but no business → redirect to onboarding
 * 4. If user and business → render dashboard
 * 
 * Special Case: If on /onboarding page, render children directly once auth is confirmed.
 */
export function DashboardGuard({ children }: DashboardGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { token, isLoading: authLoading } = useAuth();
    const [isMounted, setIsMounted] = useState(false);
    const [state, setState] = useState<{
        loading: boolean;
        capabilities?: any;
        businessName?: string;
        businessId?: string;
    }>({ loading: true });

    // Handle hydration
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        async function checkOnboardingStatus() {
            // Wait for auth context to finish loading
            if (authLoading) {
                return;
            }

            // No token = not authenticated
            if (!token) {
                router.push("/login");
                return;
            }

            const isOnboardingPage = pathname.includes("/onboarding");

            try {
                const res = await fetch("/api/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    router.push("/login");
                    return;
                }

                const data = await res.json();

                // No business data = needs onboarding
                if (!data.business || !data.business.onboardingComplete) {
                    if (!isOnboardingPage) {
                        router.push("/dashboard/onboarding");
                        return;
                    } else {
                        // We are on onboarding page, stop loading and allow render
                        setState({ loading: false });
                        return;
                    }
                }

                // Business confirmed - render dashboard
                setState({
                    loading: false,
                    capabilities: data.business.capabilities || {},
                    businessName: data.business.name,
                    businessId: data.business._id,
                });
            } catch (error) {
                console.error("Failed to check onboarding status:", error);
                if (!isOnboardingPage) {
                    router.push("/login");
                } else {
                    setState({ loading: false });
                }
            }
        }

        checkOnboardingStatus();
    }, [token, authLoading, router, isMounted, pathname]);

    // Don't render anything until mounted to avoid hydration warning
    if (!isMounted) {
        return null;
    }

    // Auth loading or checking status
    if (authLoading || state.loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Capabilities confirmed OR we are on onboarding page
    return <>{children(state.capabilities || {}, state.businessName || "Dashboard", state.businessId || "")}</>;
}