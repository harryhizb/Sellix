"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import {
    AlertCircle, Check, Building2, Bot, FileText, Bell, CreditCard,
    Sparkles, Save, Globe, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessSettings {
    _id?: string;
    name: string;
    slug?: string;
    description?: string;
    address?: string;
    contactPhone?: string;
    category?: string;
    features?: string[];
    tone?: string;
    policies?: {
        delivery?: { description: string };
        refund?: { description: string };
        payment?: { instructions: string };
    };
    settings?: {
        currency?: string;
        language?: string;
    };
    templateType?: string;
}

export default function SettingsPage() {
    const { token, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [business, setBusiness] = useState<BusinessSettings>({
        name: "",
        slug: "",
        address: "",
        contactPhone: "",
        category: "ecommerce",
        features: [],
        tone: "friendly",
        policies: {
            delivery: { description: "" },
            refund: { description: "" },
            payment: { instructions: "" }
        },
        settings: {
            currency: "USD",
            language: "en"
        },
        templateType: "sales"
    });

    const mapCapabilitiesToFeatures = (capabilities: any) => {
        const features = [];
        if (capabilities?.supportsProducts) features.push('products');
        if (capabilities?.supportsServices) features.push('services');
        if (capabilities?.supportsApproval) features.push('approval');
        if (capabilities?.supportsInformation) features.push('info');
        return features;
    };



    const fetchBusinessSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/business", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch settings: ${res.status}`);
            }

            const data = await res.json();
            if (data.business) {
                setBusiness(prev => ({
                    ...prev,
                    ...data.business,
                    features: mapCapabilitiesToFeatures(data.business.capabilities)
                }));
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Failed to load settings";
            setError(errorMessage);
            console.error("Error fetching business settings:", e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token && user?.businessId) {
            fetchBusinessSettings();
        }
    }, [token, user?.businessId, fetchBusinessSettings]);

    async function handleSave() {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            if (!business.name?.trim()) {
                throw new Error("Business name is required");
            }
            if (!business.contactPhone?.trim()) {
                throw new Error("Contact phone number is required for approval notifications");
            }

            const payload = {
                ...business,
                currency: business.settings?.currency || "PKR"
            };

            const res = await fetch("/api/business", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || errorData.message || "Failed to update settings");
            }

            const data = await res.json();
            if (data.business) {
                setBusiness(data.business);
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Error saving settings";
            setError(errorMessage);
            console.error("Error saving settings:", e);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex items-center gap-3 text-white/40">
                    <div className="w-5 h-5 border-2 border-white/10 border-t-[#25D366] rounded-full animate-spin" />
                    Loading settings...
                </div>
            </div>
        );
    }

    if (!user?.businessId) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-red-400">Error: No business ID found. Please log in again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                        Settings
                    </h1>
                    <p className="mt-1 text-white/50 text-sm">
                        Configure your business profile and AI behavior
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="btn-primary text-white rounded-full px-6 h-11"
                >
                    {saving ? (
                        <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="flex gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium">Error</p>
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                </div>
            )}

            {/* Success Alert */}
            {success && (
                <div className="flex gap-3 p-4 rounded-xl border border-[#25D366]/20 bg-[#25D366]/10 text-[#25D366]">
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p>Settings saved successfully!</p>
                </div>
            )}

            <div className="grid gap-6">
                {/* Profile Section */}
                <SettingsCard
                    icon={Building2}
                    title="Profile Details"
                    description="Visible to customers in the AI chat greeting"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-white/70">Business Name</Label>
                            <Input
                                value={business.name || ""}
                                onChange={e => setBusiness({ ...business, name: e.target.value })}
                                placeholder="Enter your business name"
                                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/70">Store Link (Slug)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                                    sellix.com/store/
                                </span>
                                <Input
                                    value={business.slug || ""}
                                    onChange={e => setBusiness({ ...business, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "") })}
                                    placeholder="my-store"
                                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11 pl-28"
                                />
                            </div>
                            <p className="text-xs text-white/40 mt-1">Customers will visit this link to order online.</p>
                        </div>
                        <div className="space-y-2 col-span-full">
                            <Label className="text-white/70">Public Contact Phone</Label>
                            <Input
                                value={business.contactPhone || ""}
                                onChange={e => setBusiness({ ...business, contactPhone: e.target.value })}
                                placeholder="+1 234 567 8900"
                                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-white/70">Description</Label>
                        <textarea
                            className="flex min-h-[100px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366]/50 transition-all resize-none"
                            placeholder="Describe your business (e.g. We sell premium organic coffee beans...)"
                            value={business.description || ""}
                            onChange={e => setBusiness({ ...business, description: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-white/70">Address</Label>
                        <Input
                            value={business.address || ""}
                            onChange={e => setBusiness({ ...business, address: e.target.value })}
                            placeholder="Business address"
                            className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11"
                        />
                    </div>
                </SettingsCard>

                {/* Bot Personality Section */}
                <SettingsCard
                    icon={Bot}
                    title="AI Personality"
                    description="Control how the bot speaks and what it prioritizes"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-white/70">Communication Tone</Label>
                            <select
                                className="flex h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white focus:outline-none focus:border-[#25D366]/50"
                                value={business.tone || "friendly"}
                                onChange={e => setBusiness({ ...business, tone: e.target.value })}
                            >
                                <option value="friendly" className="bg-slate-900">Friendly & Casual</option>
                                <option value="formal" className="bg-slate-900">Formal & Professional</option>
                                <option value="neutral" className="bg-slate-900">Neutral & Informative</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/70">Template Preference</Label>
                            <select
                                className="flex h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white focus:outline-none focus:border-[#25D366]/50"
                                value={business.templateType || "sales"}
                                onChange={e => setBusiness({ ...business, templateType: e.target.value })}
                            >
                                <option value="sales" className="bg-slate-900">Sales Focused</option>
                                <option value="support" className="bg-slate-900">Support Focused</option>
                                <option value="informational" className="bg-slate-900">General Information</option>
                            </select>
                        </div>
                    </div>
                </SettingsCard>

                {/* Policies Section */}
                <SettingsCard
                    icon={FileText}
                    title="Business Policies"
                    description="Policies the AI will use to answer customer questions"
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-white/70">Delivery Policy</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366]/50 resize-none"
                                placeholder="e.g. Same day delivery in city, 2-3 days nationwide."
                                value={business.policies?.delivery?.description || ""}
                                onChange={e => setBusiness({
                                    ...business,
                                    policies: {
                                        ...business.policies,
                                        delivery: { ...business.policies?.delivery, description: e.target.value }
                                    }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/70">Refund/Exchange Policy</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366]/50 resize-none"
                                placeholder="e.g. 7-day money back guarantee if product is unused."
                                value={business.policies?.refund?.description || ""}
                                onChange={e => setBusiness({
                                    ...business,
                                    policies: {
                                        ...business.policies,
                                        refund: { ...business.policies?.refund, description: e.target.value }
                                    }
                                })}
                            />
                        </div>
                    </div>
                </SettingsCard>

                {/* Notifications Section */}
                <SettingsCard
                    icon={Bell}
                    title="Notifications & Alerts"
                    description="Configure where you want to receive order alerts"
                >
                    <div className="space-y-2">
                        <Label className="text-white/70">Contact WhatsApp Number (for notifications)</Label>
                        <Input
                            placeholder="e.g. 923001234567"
                            value={business.contactPhone || ""}
                            onChange={e => setBusiness({ ...business, contactPhone: e.target.value })}
                            className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11"
                        />
                        <p className="text-xs text-white/40">
                            Required for Approval Flow: The AI will send a WhatsApp message to this number when a new order is ready for approval.
                        </p>
                    </div>
                </SettingsCard>

                {/* Payment Section */}
                <SettingsCard
                    icon={CreditCard}
                    title="Payment Configuration"
                    description="Instructions sent to customers when they place an order"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-white/70">Currency Symbol</Label>
                            <Input
                                value={business.settings?.currency || (business as any).currency || "PKR"}
                                onChange={e => setBusiness({ ...business, settings: { ...business.settings, currency: e.target.value } })}
                                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-white/70">Payment Instructions</Label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366]/50 resize-none"
                            placeholder="e.g. Bank Transfer: Account 1234, Bank of America. Please send proof of payment."
                            value={business.policies?.payment?.instructions || ""}
                            onChange={e => setBusiness({
                                ...business,
                                policies: {
                                    ...business.policies,
                                    payment: { ...business.policies?.payment, instructions: e.target.value }
                                }
                            })}
                        />
                    </div>
                </SettingsCard>
            </div>
        </div>
    );
}

function SettingsCard({
    icon: Icon,
    title,
    description,
    children
}: {
    icon: any;
    title: string;
    description: string;
    children: React.ReactNode
}) {
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#25D366]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                        <p className="text-sm text-white/50">{description}</p>
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-4">
                {children}
            </div>
        </div>
    );
}
