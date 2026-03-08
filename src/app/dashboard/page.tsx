"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { EcommerceDashboard } from "@/components/dashboard/EcommerceDashboard";
import { ServiceDashboard } from "@/components/dashboard/ServiceDashboard";
import { InstituteDashboard } from "@/components/dashboard/InstituteDashboard";

export default function DashboardPage() {
    const { token } = useAuth();
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        async function fetchBusinessData() {
            try {
                const res = await fetch("/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBusiness(data.business);
                }
            } catch (error) {
                console.error("Failed to fetch business data", error);
            } finally {
                setLoading(false);
            }
        }

        fetchBusinessData();
    }, [token]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!business) {
        return <div>No business data found.</div>;
    }

    // Extract category - default to ecommerce for all businesses
    const category = business.category || "ecommerce";
    
    // Extract capabilities (fallback to empty object if not present)
    const caps = business.capabilities || {};

    // Determine which dashboard to render based on category
    // Only render non-ecommerce dashboards if explicitly set
    
    if (category === "service" || category === "services") {
        return <ServiceDashboard business={business} />;
    }
    
    if (category === "institute" || category === "education" || category === "ngo" || category === "organization") {
        return <InstituteDashboard business={business} />;
    }
    
    // Default ALL other categories (ecommerce, restaurant, products, or undefined) to EcommerceDashboard
    // This ensures new businesses always get the ecommerce dashboard
    return <EcommerceDashboard business={business} />;
}
