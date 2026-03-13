"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface Capabilities {
    supportsProducts: boolean;
    supportsServices: boolean;
    supportsBooking: boolean;
    supportsCart: boolean;
    supportsInformation: boolean;
}

export interface BusinessData {
    _id: string;
    name: string;
    // category may still exist in old records but we ignore it
    category?: string;
    capabilities: Capabilities;
    [key: string]: any;
}

interface BusinessContextType {
    business: BusinessData | null;
    capabilities: Capabilities;
    isLoading: boolean;
    error: string | null;
    refreshBusiness: () => Promise<void>;
}

const defaultCapabilities: Capabilities = {
    supportsProducts: false,
    supportsServices: false,
    supportsBooking: false,
    supportsCart: false,
    supportsInformation: false,
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
    const { user, token } = useAuth();
    const [business, setBusiness] = useState<BusinessData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBusiness = async () => {
        if (!user?.businessId || !token) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch(`/api/business`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const responseData = await res.json();
                const data = responseData.business;

                // If business document already has capabilities, use them
                if (data.capabilities) {
                    setBusiness(data);
                } else {
                    // For very old records, derive a minimal set from category (if present)
                    // This is a temporary fallback and should be removed after migration.
                    const cat = (data.category || "").toLowerCase();
                    const fallbackCaps: Capabilities = {
                        supportsProducts: ['ecommerce', 'restaurant'].includes(cat),
                        supportsServices: ['service'].includes(cat),
                        supportsBooking: ['service'].includes(cat),
                        supportsCart: ['ecommerce', 'restaurant'].includes(cat),
                        supportsInformation: ['institute', 'organization'].includes(cat),
                    };
                    setBusiness({ ...data, capabilities: fallbackCaps });
                }
                setError(null);
            } else {
                const errData = await res.json();
                setError(errData.error || "Failed to fetch business details");
            }
        } catch (err: any) {
            console.error("Error fetching business context:", err);
            setError(err.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBusiness();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.businessId, token]);

    return (
        <BusinessContext.Provider
            value={{
                business,
                capabilities: business?.capabilities || defaultCapabilities,
                isLoading,
                error,
                refreshBusiness: fetchBusiness
            }}
        >
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusiness() {
    const context = useContext(BusinessContext);
    if (context === undefined) {
        throw new Error("useBusiness must be used within a BusinessProvider");
    }
    return context;
}