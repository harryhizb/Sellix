"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    Store, Settings, Sparkles, Image as ImageIcon, Save, Loader2,
    Palette, Grid, Columns, Type, Moon, Sun,
    Eye, EyeOff, ChevronDown, ChevronUp, GripVertical, Plus, Edit3, Trash2,
    Truck, ShieldCheck, HeadphonesIcon, Phone,
    Layout, ArrowRight, ExternalLink, Globe, Monitor, Smartphone,
    Check, Zap, AlertCircle, X, FileText, Info
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Feature {
    title: string;
    description: string;
    icon: string;
}

interface FAQ {
    question: string;
    answer: string;
}

type SectionType = "hero" | "categories" | "products" | "trust" | "about" | "testimonials" | "features" | "faq" | "footer";

interface Testimonial { name: string; text: string; rating: number; }
interface TrustBadge { icon: string; label: string; sub: string; }
interface AboutStat { value: string; label: string; }

interface StorefrontConfig {
    storeName: string;
    navbarTitle: string;
    heroTitle: string;
    heroSubtitle: string;
    heroAlign: "center" | "left";
    ctaText: string;
    ctaSecondaryText: string;
    ctaLink: string;
    footerText: string;
    footerDescription: string;
    contactInfo: string;
    logoUrl: string;
    coverUrl: string;
    features: Feature[];
    faqs: FAQ[];
    testimonials: Testimonial[];
    trustBadges: TrustBadge[];
    aboutTitle: string;
    aboutBody: string;
    aboutStats: AboutStat[];
    theme: {
        primaryColor: string;
        textColor: string;
        bgColor: string;
        fontFamily: string;
        darkMode: boolean;
    };
    layout: {
        heroLayout: "split" | "centered" | "full";
        featuresLayout: "grid-3" | "grid-4";
        featuresStyle: "minimal" | "cards" | "accent";
        faqStyle: "minimal" | "cards" | "accent";
    };
    sections: {
        order: SectionType[];
        hidden: SectionType[];
    };
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        whatsapp?: string;
    };
    contactEmail?: string;
    contactPhone?: string;
    footerStyle?: "dark" | "navy" | "slate";
}

interface Business {
    name: string;
    slug: string;
    contactPhone?: string;
    storefront?: Partial<StorefrontConfig>;
}

const DEFAULT_FEATURES: Feature[] = [
    { title: "Fast Delivery", description: "Quick and reliable shipping to your doorstep.", icon: "Truck" },
    { title: "Quality Products", description: "We carefully select products to ensure the best experience.", icon: "ShieldCheck" },
    { title: "Customer Support", description: "Our team is here to help whenever you need assistance.", icon: "HeadphonesIcon" }
];

const DEFAULT_FAQS: FAQ[] = [
    { question: "How long does delivery take?", answer: "Delivery usually takes 2–6 business days depending on location." },
    { question: "What payment methods do you accept?", answer: "We accept Cash on Delivery and other payment options provided by the store." },
];

const MOCK_PRODUCTS = [
    { id: 1, name: "Premium Headphones", price: "$199.99", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80" },
    { id: 2, name: "Smart Fitness Watch", price: "$149.00", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80" },
    { id: 3, name: "Classic Leather Bag", price: "$89.50", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80" },
    { id: 4, name: "Designer Sunglasses", price: "$49.99", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80" },
];

const FONTS = [
    { name: "Inter (Modern)", value: "font-sans" },
    { name: "Playfair (Classic)", value: "font-serif" },
    { name: "JetBrains (Tech)", value: "font-mono" },
];

const FEATURE_ICON_OPTIONS = ["Truck", "ShieldCheck", "HeadphonesIcon", "Phone", "Store"];
const ICONS_MAP: Record<string, any> = { Truck, ShieldCheck, HeadphonesIcon, Phone, Store };

// ─── QA Checklist Modal ───────────────────────────────────────────────────────
function QAChecklistModal({
    cfg, onConfirm, onCancel, saving
}: {
    cfg: StorefrontConfig;
    onConfirm: () => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const checks = [
        { label: "Store name is set", pass: cfg.storeName.trim().length > 0 },
        { label: "Hero title is set", pass: cfg.heroTitle.trim().length > 0 },
        { label: "Hero subtitle is set", pass: cfg.heroSubtitle.trim().length > 0 },
        { label: "CTA button text is set", pass: cfg.ctaText.trim().length > 0 },
        { label: "Logo uploaded", pass: !!cfg.logoUrl },
        { label: "Hero banner image uploaded", pass: !!cfg.coverUrl },
        { label: "Contact phone is set", pass: !!(cfg.contactPhone || cfg.contactInfo) },
        { label: "Contact email is set", pass: !!cfg.contactEmail },
        { label: "Footer description is set", pass: !!(cfg.footerText || cfg.footerDescription) },
        { label: "At least one visible section", pass: cfg.sections.order.length > cfg.sections.hidden.length },
    ];
    const passed = checks.filter(c => c.pass).length;
    const total = checks.length;
    const allGood = passed === total;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${allGood ? "bg-emerald-500/15" : "bg-amber-500/15"}`}>
                            {allGood ? <Check className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-amber-400" />}
                        </div>
                        <div>
                            <h2 className="text-white font-black text-base tracking-tight">Pre-Publish Checklist</h2>
                            <p className="text-slate-500 text-xs">{passed}/{total} items ready</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="px-6 pt-4">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(passed / total) * 100}%`, backgroundColor: allGood ? "#10b981" : "#f59e0b" }} />
                    </div>
                </div>

                {/* Checks */}
                <div className="p-6 space-y-2 max-h-72 overflow-y-auto">
                    {checks.map((c, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${c.pass ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.pass ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                                {c.pass
                                    ? <Check className="w-3 h-3 text-emerald-400" />
                                    : <X className="w-3 h-3 text-red-400" />
                                }
                            </div>
                            <span className={`text-xs font-semibold ${c.pass ? "text-slate-300" : "text-slate-400"}`}>{c.label}</span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800 transition-colors">
                        Go Back & Fix
                    </button>
                    <button onClick={onConfirm} disabled={saving}
                        className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${allGood ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20" : "bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"}`}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {allGood ? "Publish Now" : "Publish Anyway"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Editable Text ───────────────────────────────────────────────────────────
function EditableText({
    tag: Tag = "div", value, placeholder, onChange, className, style, multiline = false
}: any) {
    const [editing, setEditing] = useState(false);
    const [tempVal, setTempVal] = useState(value);
    useEffect(() => { setTempVal(value); }, [value]);

    const handleSave = () => { onChange(tempVal); setEditing(false); };

    if (editing) {
        if (multiline) {
            return (
                <textarea
                    autoFocus
                    value={tempVal}
                    onChange={e => setTempVal(e.target.value)}
                    onBlur={handleSave}
                    className={`w-full bg-black/10 dark:bg-white/10 border-2 border-emerald-500 rounded-xl p-3 focus:outline-none shadow-lg resize-none ${className}`}
                    style={style}
                    rows={Math.max(3, tempVal?.split('\n').length || 3)}
                />
            );
        }
        return (
            <input
                autoFocus
                value={tempVal}
                onChange={e => setTempVal(e.target.value)}
                onBlur={handleSave}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                className={`w-full bg-black/10 dark:bg-white/10 border-2 border-emerald-500 rounded-xl px-3 py-1.5 focus:outline-none shadow-lg ${className}`}
                style={style}
            />
        );
    }

    return (
        <Tag
            onClick={() => setEditing(true)}
            style={style}
            className={`relative group cursor-text hover:ring-2 hover:ring-emerald-400 hover:ring-offset-2 rounded-xl transition-all ${!value ? "opacity-50 italic" : ""} ${className}`}
            title="Click to edit"
        >
            {value || placeholder}
            <div className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none z-10">
                <Edit3 className="w-3.5 h-3.5" />
            </div>
        </Tag>
    );
}

// ─── Section Label Badge ─────────────────────────────────────────────────────
function SectionBadge({ label }: { label: string }) {
    return (
        <div className="absolute top-3 left-3 z-20 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg pointer-events-none">
            {label}
        </div>
    );
}

// ─── Sidebar Input ────────────────────────────────────────────────────────────
function SidebarInput({ label, value, onChange, placeholder, multiline = false, rows = 2 }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; multiline?: boolean; rows?: number;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block">{label}</label>
            {multiline ? (
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    rows={rows}
                    placeholder={placeholder}
                    className="w-full bg-slate-900 border border-slate-700 text-xs p-2.5 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
            ) : (
                <input
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-slate-900 border border-slate-700 text-xs p-2.5 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
            )}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdvancedStorefrontEditor() {
    const { token } = useAuth();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showQA, setShowQA] = useState(false);

    const [activeTab, setActiveTab] = useState<"design" | "content">("design");
    const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

    const [cfg, setCfg] = useState<StorefrontConfig>({
        storeName: "", navbarTitle: "", heroTitle: "", heroSubtitle: "",
        heroAlign: "center", ctaText: "Shop Now", ctaSecondaryText: "Browse Categories", ctaLink: "#products",
        footerText: "", footerDescription: "", contactInfo: "", logoUrl: "", coverUrl: "",
        features: DEFAULT_FEATURES, faqs: DEFAULT_FAQS,
        testimonials: [], trustBadges: [],
        aboutTitle: "Our Story", aboutBody: "", aboutStats: [],
        theme: { primaryColor: "#10b981", textColor: "#1e293b", bgColor: "#ffffff", fontFamily: "font-sans", darkMode: false },
        layout: { heroLayout: "split", featuresLayout: "grid-3", featuresStyle: "cards", faqStyle: "cards" },
        // Only categories, trust, testimonials hidden by default — features, about, faq are visible
        sections: {
            order: ["hero", "categories", "products", "trust", "about", "testimonials", "features", "faq", "footer"],
            hidden: ["categories", "trust", "testimonials"]
        },
        contactEmail: "", contactPhone: "", socialLinks: { facebook: "", instagram: "", twitter: "", whatsapp: "" },
        footerStyle: "dark"
    });

    const logoRef = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!token) return;
        fetch("/api/business", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                const biz = data.business || data;
                if (!data.error) {
                    setBusiness(biz);
                    const sf = biz.storefront || {};
                    setCfg(prev => ({
                        ...prev,
                        storeName: sf.storeName || biz.name || "",
                        navbarTitle: sf.navbarTitle || biz.name || "",
                        heroTitle: sf.heroTitle || "Discover Quality Products You'll Love",
                        heroSubtitle: sf.heroSubtitle || "We bring you carefully selected products designed to make everyday life better.",
                        heroAlign: sf.heroAlign || "center",
                        ctaText: sf.ctaText || "Shop Now",
                        ctaSecondaryText: sf.ctaSecondaryText || "Browse Categories",
                        ctaLink: sf.ctaLink || "#products",
                        footerText: sf.footerText || `© ${new Date().getFullYear()} ${biz.name}. All rights reserved.`,
                        footerDescription: sf.footerDescription || biz.description || "",
                        contactInfo: sf.contactInfo || biz.contactPhone || "",
                        logoUrl: sf.logoUrl || "",
                        coverUrl: sf.coverUrl || "",
                        features: sf.features?.length ? sf.features : DEFAULT_FEATURES,
                        faqs: sf.faqs?.length ? sf.faqs : DEFAULT_FAQS,
                        testimonials: sf.testimonials || [],
                        trustBadges: sf.trustBadges || [],
                        aboutTitle: sf.aboutTitle || "Our Story",
                        aboutBody: sf.aboutBody || "",
                        aboutStats: sf.aboutStats || [],
                        theme: { ...prev.theme, ...sf.theme },
                        layout: { ...prev.layout, ...sf.layout },
                        sections: {
                            order: sf.sections?.order?.length ? sf.sections.order : prev.sections.order,
                            hidden: sf.sections?.hidden || prev.sections.hidden
                        },
                        contactEmail: sf.contactEmail || "",
                        contactPhone: sf.contactPhone || biz.contactPhone || "",
                        socialLinks: { facebook: "", instagram: "", twitter: "", whatsapp: "", ...sf.socialLinks },
                        footerStyle: sf.footerStyle || "dark"
                    }));
                }
            })
            .catch(() => toast.error("Failed to load business data"))
            .finally(() => setLoading(false));
    }, [token]);

    const setField = (key: keyof StorefrontConfig, val: any) => setCfg(p => ({ ...p, [key]: val }));
    const setTheme = (key: keyof StorefrontConfig['theme'], val: any) => setCfg(p => ({ ...p, theme: { ...p.theme, [key]: val } }));
    const setLayout = (key: keyof StorefrontConfig['layout'], val: any) => setCfg(p => ({ ...p, layout: { ...p.layout, [key]: val } }));

    const updateFeature = (index: number, key: string, value: string) => {
        setCfg(p => {
            const arr = [...p.features];
            arr[index] = { ...arr[index], [key]: value };
            return { ...p, features: arr };
        });
    };
    const updateFaq = (index: number, key: keyof FAQ, value: string) => {
        setCfg(p => {
            const arr = [...p.faqs];
            arr[index] = { ...arr[index], [key]: value };
            return { ...p, faqs: arr };
        });
    };
    const updateTestimonial = (index: number, key: keyof Testimonial, value: any) => {
        setCfg(p => {
            const arr = [...(p.testimonials || [])];
            arr[index] = { ...arr[index], [key]: value };
            return { ...p, testimonials: arr };
        });
    };
    const updateTrustBadge = (index: number, key: keyof TrustBadge, value: string) => {
        setCfg(p => {
            const arr = [...(p.trustBadges || [])];
            arr[index] = { ...arr[index], [key]: value };
            return { ...p, trustBadges: arr };
        });
    };

    const removeFeature = (index: number) => setCfg(p => ({ ...p, features: p.features.filter((_, i) => i !== index) }));
    const removeFaq = (index: number) => setCfg(p => ({ ...p, faqs: p.faqs.filter((_, i) => i !== index) }));
    const removeTestimonial = (index: number) => setCfg(p => ({ ...p, testimonials: (p.testimonials || []).filter((_, i) => i !== index) }));
    const removeTrustBadge = (index: number) => setCfg(p => ({ ...p, trustBadges: (p.trustBadges || []).filter((_, i) => i !== index) }));

    const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>, key: "logoUrl" | "coverUrl") => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = key === "coverUrl" ? 10 * 1024 * 1024 : 2 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error(`Image must be under ${key === "coverUrl" ? "10MB" : "2MB"}`);
            return;
        }
        const r = new FileReader();
        r.onloadend = () => setField(key, r.result);
        r.readAsDataURL(file);
    };

    const doSave = async () => {
        if (!token) return;
        setSaving(true);
        try {
            const payloadCfg = { ...cfg };
            if (!payloadCfg.sections.hidden.includes("trust") && (!payloadCfg.trustBadges || payloadCfg.trustBadges.length === 0)) {
                payloadCfg.trustBadges = [
                    { icon: "🔒", label: "Secure Checkout", sub: "100% Protected" },
                    { icon: "💬", label: "WhatsApp Verified", sub: "Instant Support" },
                    { icon: "🚚", label: "Fast Delivery", sub: "2–6 Business Days" },
                    { icon: "🔄", label: "Easy Returns", sub: "Hassle-free Policy" },
                ];
            }
            if (!payloadCfg.sections.hidden.includes("testimonials") && (!payloadCfg.testimonials || payloadCfg.testimonials.length === 0)) {
                payloadCfg.testimonials = [
                    { name: "Sarah M.", text: "Absolutely love this store! Products arrived quickly and quality exceeded my expectations.", rating: 5 },
                    { name: "Ahmed K.", text: "Super easy to order via WhatsApp. The team was responsive and helpful throughout.", rating: 5 },
                    { name: "Fatima R.", text: "Great prices and authentic products. Will definitely be a returning customer!", rating: 5 },
                ];
            }

            const res = await fetch("/api/business", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ storefront: payloadCfg }),
            });
            if (res.ok) {
                toast.success("Storefront published successfully!");
                setSaved(true);
                setCfg(payloadCfg);
                setTimeout(() => setSaved(false), 2500);
            } else toast.error((await res.json()).error || "Failed to save");
        } catch {
            toast.error("Network error saving storefront");
        } finally {
            setSaving(false);
            setShowQA(false);
        }
    };

    const handleSave = () => setShowQA(true);

    const toggleHide = (type: SectionType) => {
        setCfg(p => {
            const hidden = p.sections.hidden.includes(type)
                ? p.sections.hidden.filter(t => t !== type)
                : [...p.sections.hidden, type];
            return { ...p, sections: { ...p.sections, hidden } };
        });
    };

    const moveSec = (type: SectionType, dir: "up" | "down") => {
        setCfg(p => {
            const idx = p.sections.order.indexOf(type);
            if (idx === -1) return p;
            const newIdx = dir === "up" ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= p.sections.order.length) return p;
            const order = [...p.sections.order];
            [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
            return { ...p, sections: { ...p.sections, order } };
        });
    };

    if (loading) return (
        <div className="flex justify-center items-center py-40">
            <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-emerald-500 absolute inset-0 m-auto" />
            </div>
        </div>
    );

    if (!business?.slug) return (
        <div className="max-w-md mx-auto mt-20 p-10 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl text-center shadow-2xl">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Globe className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Set Up Your Store URL</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">You need a unique store slug before you can launch the visual builder.</p>
            <Link href="/dashboard/settings" className="bg-emerald-500 text-emerald-950 px-8 py-3.5 rounded-2xl font-black hover:bg-emerald-400 inline-flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                Go to Settings <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );

    const storeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/store/${business.slug}`;

    const isDark = cfg.theme.darkMode;
    const pCol = cfg.theme.primaryColor;
    const headingColor = isDark ? "#ffffff" : "#0f172a";
    const tCol = isDark ? "#cbd5e1" : cfg.theme.textColor;
    const bCol = isDark ? "#0f172a" : cfg.theme.bgColor;

    // ─── PREVIEW SECTION RENDERERS ─────────────────────────────────────────────
    const renderSection = (type: SectionType, isMobile: boolean) => {
        if (cfg.sections.hidden.includes(type)) return null;
        const baseStyle: React.CSSProperties = { backgroundColor: bCol, color: tCol };

        if (type === "hero") {
            return (
                <div key={type} className={`${cfg.theme.fontFamily} relative`} style={baseStyle}>
                    <SectionBadge label="Hero" />
                    <div
                        className="flex items-center justify-between px-6 py-4 border-b"
                        style={{
                            backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
                            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
                        }}
                    >
                        <div className="flex items-center gap-3">
                            {cfg.logoUrl ? (
                                <img src={cfg.logoUrl} alt="Logo" className="w-9 h-9 rounded-lg object-cover" />
                            ) : (
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base text-white shadow-lg" style={{ backgroundColor: pCol }}>
                                    {cfg.storeName.charAt(0) || "S"}
                                </div>
                            )}
                            <EditableText tag="div" value={cfg.navbarTitle} onChange={(v: string) => setField("navbarTitle", v)}
                                placeholder="Store Name" className="font-extrabold text-base" style={{ color: headingColor }} />
                        </div>
                        {!isMobile && (
                            <div className="flex gap-6 text-sm font-semibold" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                                <span>Home</span><span>Products</span><span>About</span><span>FAQ</span>
                            </div>
                        )}
                    </div>

                    {cfg.layout.heroLayout === "split" && (
                        <div className={`flex ${isMobile ? "flex-col" : "flex-row"} items-center max-w-7xl mx-auto px-6 py-16 gap-10`}>
                            <div className={`flex-1 flex flex-col ${isMobile ? "text-center items-center" : "items-start"}`}>
                                <div className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-5" style={{ backgroundColor: `${pCol}20`, color: pCol }}>
                                    Official Store
                                </div>
                                <EditableText tag="h1" value={cfg.heroTitle} onChange={(v: string) => setField("heroTitle", v)} multiline
                                    style={{ color: headingColor }}
                                    className={`font-black tracking-tight leading-tight mb-5 ${isMobile ? "text-3xl" : "text-5xl"}`} />
                                <EditableText tag="p" value={cfg.heroSubtitle} onChange={(v: string) => setField("heroSubtitle", v)} multiline
                                    style={{ color: tCol }} className="text-base opacity-80 mb-8 max-w-lg leading-relaxed" />
                                <div className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-bold text-white shadow-xl cursor-pointer hover:scale-105 transition-transform" style={{ backgroundColor: pCol }}>
                                    <EditableText tag="span" value={cfg.ctaText} onChange={(v: string) => setField("ctaText", v)} />
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                            {(!isMobile || cfg.coverUrl) && (
                                <div className={`flex-1 w-full ${isMobile ? "order-first mb-6" : ""}`}>
                                    {cfg.coverUrl ? (
                                        <img src={cfg.coverUrl} className="w-full aspect-[4/3] object-cover rounded-3xl shadow-2xl" alt="Banner" />
                                    ) : (
                                        <div className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
                                            style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                                            <ImageIcon className="w-10 h-10" />
                                            <span className="font-semibold text-sm">Upload Hero Image</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {cfg.layout.heroLayout === "centered" && (
                        <div className="flex flex-col items-center text-center max-w-4xl mx-auto px-6 py-24">
                            <div className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6" style={{ backgroundColor: `${pCol}20`, color: pCol }}>Official Store</div>
                            <EditableText tag="h1" value={cfg.heroTitle} onChange={(v: string) => setField("heroTitle", v)} multiline
                                style={{ color: headingColor }}
                                className={`font-black tracking-tight leading-tight mb-6 ${isMobile ? "text-4xl" : "text-6xl"}`} />
                            <EditableText tag="p" value={cfg.heroSubtitle} onChange={(v: string) => setField("heroSubtitle", v)} multiline
                                style={{ color: tCol }} className="text-lg opacity-80 mb-10 max-w-2xl leading-relaxed" />
                            <div className="inline-flex items-center gap-2 rounded-2xl px-10 py-4 font-bold text-white shadow-xl cursor-pointer hover:scale-105 transition-transform text-lg" style={{ backgroundColor: pCol }}>
                                <EditableText tag="span" value={cfg.ctaText} onChange={(v: string) => setField("ctaText", v)} />
                            </div>
                        </div>
                    )}

                    {cfg.layout.heroLayout === "full" && (
                        <div className="relative flex flex-col items-center justify-center text-center px-6 py-32 min-h-[500px]">
                            {cfg.coverUrl && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cfg.coverUrl})` }} />}
                            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
                            <div className="relative z-10 max-w-4xl">
                                <EditableText tag="h1" value={cfg.heroTitle} onChange={(v: string) => setField("heroTitle", v)} multiline
                                    style={{ color: "#ffffff" }}
                                    className={`font-black tracking-tight leading-tight mb-6 ${isMobile ? "text-4xl" : "text-6xl"}`} />
                                <EditableText tag="p" value={cfg.heroSubtitle} onChange={(v: string) => setField("heroSubtitle", v)} multiline
                                    style={{ color: "#e2e8f0" }} className="text-lg opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed" />
                                <div className="inline-flex items-center gap-2 rounded-2xl px-10 py-4 font-bold shadow-xl cursor-pointer hover:scale-105 transition-transform text-lg" style={{ backgroundColor: pCol, color: "#fff" }}>
                                    <EditableText tag="span" value={cfg.ctaText} onChange={(v: string) => setField("ctaText", v)} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (type === "products") {
            return (
                <div key={type} className={`${cfg.theme.fontFamily} relative py-20 px-6`}
                    style={{ ...baseStyle, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
                    <SectionBadge label="Products" />
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-end mb-10">
                            <h2 className={`font-black tracking-tight ${isMobile ? "text-3xl" : "text-4xl"}`} style={{ color: headingColor }}>
                                Featured Products
                            </h2>
                            {!isMobile && (
                                <span className="font-bold flex items-center gap-2 text-sm cursor-pointer hover:underline" style={{ color: pCol }}>
                                    View All <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </div>
                        <div className={`grid gap-5 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
                            {MOCK_PRODUCTS.slice(0, isMobile ? 2 : 4).map(p => (
                                <div key={p.id} className="group rounded-3xl overflow-hidden border hover:shadow-2xl transition-all duration-300"
                                    style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.01)" }}>
                                    <div className="aspect-[4/5] overflow-hidden">
                                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold mb-2 line-clamp-1 text-sm" style={{ color: headingColor }}>{p.name}</h3>
                                        <div className="text-base font-black" style={{ color: pCol }}>{p.price}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "features") {
            const isGrid3 = cfg.layout.featuresLayout === "grid-3";
            const fStyle = cfg.layout.featuresStyle || "cards";
            return (
                <div key={type} className={`${cfg.theme.fontFamily} relative py-24 px-6`}
                    style={{ ...baseStyle, backgroundColor: fStyle === "accent" ? `${pCol}10` : (isDark ? "#0a1628" : "#f8fafc") }}>
                    <SectionBadge label="Features" />
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-14">
                            <h2 className={`font-black tracking-tight mb-4 ${isMobile ? "text-3xl" : "text-5xl"}`} style={{ color: headingColor }}>Why Choose Us</h2>
                            <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: tCol, opacity: 0.7 }}>
                                We are committed to providing the best service to our customers.
                            </p>
                        </div>
                        <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : isGrid3 ? "grid-cols-3" : "grid-cols-4"}`}>
                            {cfg.features.map((f, i) => {
                                const IconComp = ICONS_MAP[f.icon] || Store;
                                const cardClass = fStyle === "minimal"
                                    ? "p-6 rounded-3xl text-center group"
                                    : "p-8 rounded-3xl text-center border hover:-translate-y-1 transition-transform shadow-xl";
                                const cardStyle = fStyle === "minimal" ? {} : {
                                    backgroundColor: fStyle === "accent" ? (isDark ? "rgba(0,0,0,0.2)" : "#ffffff") : (isDark ? "#0f172a" : "#ffffff"),
                                    borderColor: fStyle === "accent" ? "transparent" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")
                                };
                                return (
                                    <div key={i} className={cardClass} style={cardStyle}>
                                        <div className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center ${fStyle === "minimal" ? "group-hover:scale-110 transition-transform bg-transparent" : ""}`}
                                            style={fStyle === "minimal" ? { color: pCol } : { backgroundColor: `${pCol}18`, color: pCol }}>
                                            <IconComp className={fStyle === "minimal" ? "w-10 h-10" : "w-7 h-7"} />
                                        </div>
                                        <EditableText tag="h3" value={f.title} onChange={(v: string) => updateFeature(i, 'title', v)}
                                            className="text-lg font-black mb-2 block" style={{ color: headingColor }} />
                                        <EditableText tag="p" multiline value={f.description} onChange={(v: string) => updateFeature(i, 'description', v)}
                                            className="text-sm leading-relaxed block" style={{ color: tCol, opacity: 0.7 }} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "faq") {
            const fStyle = cfg.layout.faqStyle || "cards";
            return (
                <div key={type} className={`${cfg.theme.fontFamily} relative py-24 px-6`}
                    style={{ ...baseStyle, backgroundColor: fStyle === "accent" ? `${pCol}10` : "transparent", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
                    <SectionBadge label="FAQ" />
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-14">
                            <h2 className={`font-black tracking-tight mb-4 ${isMobile ? "text-3xl" : "text-5xl"}`} style={{ color: headingColor }}>Frequently Asked Questions</h2>
                            <p className="text-base" style={{ color: tCol, opacity: 0.6 }}>Click questions to expand and edit answers.</p>
                        </div>
                        <div className="space-y-3">
                            {cfg.faqs.map((faq, i) => {
                                const isMinimal = fStyle === "minimal";
                                const cardClass = isMinimal ? "pb-6 border-b" : "p-6 rounded-2xl border";
                                const cardStyle = isMinimal ? { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" } : {
                                    borderColor: fStyle === "accent" ? "transparent" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
                                    backgroundColor: fStyle === "accent" ? (isDark ? "rgba(0,0,0,0.2)" : "#ffffff") : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)")
                                };
                                return (
                                    <div key={i} className={cardClass} style={cardStyle}>
                                        <div className="flex gap-4 items-start">
                                            <ChevronDown className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: pCol }} />
                                            <div className="flex-1">
                                                <EditableText tag="h4" value={faq.question} onChange={(v: string) => updateFaq(i, 'question', v)}
                                                    className="text-base font-black mb-2 block" style={{ color: headingColor }} />
                                                <EditableText tag="p" multiline value={faq.answer} onChange={(v: string) => updateFaq(i, 'answer', v)}
                                                    className="text-sm leading-relaxed block" style={{ color: tCol, opacity: 0.75 }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "footer") {
            const footerBgMap: Record<string, string> = { navy: "#0f172a", slate: "#1e293b", dark: "#020617" };
            const footerBg = footerBgMap[cfg.footerStyle || "dark"] || "#020617";
            const hasSocials = cfg.socialLinks?.facebook || cfg.socialLinks?.instagram || cfg.socialLinks?.twitter;
            return (
                <div key={type} className={`${cfg.theme.fontFamily} relative`} style={{ backgroundColor: footerBg, color: "#fff" }}>
                    <SectionBadge label="Footer" />
                    <div className={`max-w-7xl mx-auto px-6 ${isMobile ? "py-10" : "py-16"}`}>
                        <div className={`grid ${isMobile ? "grid-cols-1 gap-8" : "grid-cols-3 gap-12"} mb-10`}>
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    {cfg.logoUrl ? (
                                        <img src={cfg.logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-xl font-black flex items-center justify-center text-white text-sm shadow-lg" style={{ backgroundColor: pCol }}>
                                            {cfg.storeName.charAt(0) || "S"}
                                        </div>
                                    )}
                                    <span className="font-black text-lg text-white">{cfg.storeName || "Store"}</span>
                                </div>
                                <EditableText tag="p" value={cfg.footerText} onChange={(v: string) => setField("footerText", v)}
                                    className="text-slate-400 text-xs leading-relaxed mb-5" multiline />
                                {hasSocials ? (
                                    <div className="flex gap-2">
                                        {["facebook", "instagram", "twitter"].map(s =>
                                            (cfg.socialLinks as any)?.[s] ? (
                                                <div key={s} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                                                    <div className="w-3.5 h-3.5 rounded-sm bg-slate-400/60" />
                                                </div>
                                            ) : null
                                        )}
                                    </div>
                                ) : <p className="text-slate-600 text-xs italic">No social links set yet</p>}
                            </div>
                            {!isMobile && (
                                <div>
                                    <h3 className="text-white font-black text-sm mb-5 tracking-tight">Quick Links</h3>
                                    <ul className="space-y-3 text-slate-400 text-xs font-medium">
                                        {["Home", "Products", "About", "FAQ"].map(l => (
                                            <li key={l} className="hover:text-white transition-colors cursor-pointer">{l}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div>
                                <h3 className="text-white font-black text-sm mb-5 tracking-tight">Contact Us</h3>
                                <ul className="space-y-3 text-slate-400 text-xs font-medium">
                                    <li className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: pCol }} />
                                        <span>{cfg.contactPhone || "No phone set"}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: pCol }} />
                                        <span>{cfg.contactEmail || "No email set"}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                            <p className="text-slate-500 text-xs font-medium">{cfg.footerText || `© ${new Date().getFullYear()} ${cfg.storeName}. All rights reserved.`}</p>
                            <p className="text-slate-600 text-xs font-black tracking-widest uppercase">Powered by Sellix</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "categories") return (
            <div key={type} className={`${cfg.theme.fontFamily} relative py-16 px-6`}
                style={{ ...baseStyle, backgroundColor: isDark ? "#0a1628" : "#f8fafc" }}>
                <SectionBadge label="Categories" />
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className={`font-black tracking-tight mb-2 ${isMobile ? "text-2xl" : "text-4xl"}`} style={{ color: headingColor }}>Shop by Category</h2>
                        <p className="text-sm" style={{ color: tCol }}>Find exactly what you&apos;re looking for.</p>
                    </div>
                    <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
                        {["👗 Fashion", "📱 Electronics", "🛋️ Home", "🌿 Beauty"].map((c, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-6 rounded-3xl border"
                                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                <span className="text-4xl mb-3">{c.split(" ")[0]}</span>
                                <span className="font-black text-sm" style={{ color: headingColor }}>{c.split(" ").slice(1).join(" ")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );

        if (type === "trust") {
            const displayBadges = cfg.trustBadges?.length ? cfg.trustBadges : [
                { icon: "🔒", label: "Secure Checkout", sub: "100% Protected" },
                { icon: "💬", label: "WhatsApp Verified", sub: "Instant Support" },
                { icon: "🚚", label: "Fast Delivery", sub: "2–6 Business Days" },
                { icon: "🔄", label: "Easy Returns", sub: "Hassle-free Policy" },
            ];
            return (
                <div key={type} className={`${cfg.theme.fontFamily} relative py-8 px-6`}
                    style={{ backgroundColor: `${pCol}12`, borderTop: `1px solid ${pCol}28`, borderBottom: `1px solid ${pCol}28` }}>
                    <SectionBadge label="Trust Bar" />
                    <div className={`max-w-7xl mx-auto grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
                        {displayBadges.map((b, i) => (
                            <div key={i} className="flex items-center gap-3 p-2">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${pCol}20` }}>{b.icon}</div>
                                <div>
                                    <p className="font-black text-xs" style={{ color: headingColor }}>{b.label}</p>
                                    <p className="text-[10px]" style={{ color: tCol }}>{b.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (type === "about") return (
            <div key={type} className={`${cfg.theme.fontFamily} relative py-20 px-6`}
                style={{ ...baseStyle, backgroundColor: isDark ? "#0a1628" : "#f8fafc" }}>
                <SectionBadge label="About" />
                <div className={`max-w-7xl mx-auto flex ${isMobile ? "flex-col" : "flex-row"} gap-12 items-center`}>
                    <div className="flex-1 aspect-[4/3] rounded-3xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${pCol}30, ${pCol}10)`, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}` }}>
                        {cfg.logoUrl
                            ? <img src={cfg.logoUrl} alt="" className="w-24 h-24 object-contain rounded-2xl" />
                            : <span className="text-6xl font-black" style={{ color: `${pCol}80` }}>{cfg.storeName.charAt(0) || "S"}</span>
                        }
                    </div>
                    <div className="flex-1">
                        <div className="inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4" style={{ backgroundColor: `${pCol}18`, color: pCol }}>About Us</div>
                        <EditableText tag="h2" value={cfg.aboutTitle} onChange={(v: string) => setField("aboutTitle", v)}
                            className={`font-black tracking-tight mb-4 ${isMobile ? "text-3xl" : "text-4xl"}`} style={{ color: headingColor }} />
                        <EditableText tag="p" multiline value={cfg.aboutBody || "We are passionate about bringing you the finest products with a seamless shopping experience."}
                            onChange={(v: string) => setField("aboutBody", v)}
                            className="text-sm leading-relaxed" style={{ color: tCol }} />
                    </div>
                </div>
            </div>
        );

        if (type === "testimonials") {
            const displayTestimonials = cfg.testimonials?.length ? cfg.testimonials : [
                { name: "Sarah M.", text: "Absolutely love this store! Products arrived quickly and quality exceeded my expectations.", rating: 5 },
                { name: "Ahmed K.", text: "Super easy to order via WhatsApp. The team was responsive and helpful throughout.", rating: 5 },
                { name: "Fatima R.", text: "Great prices and authentic products. Will definitely be a returning customer!", rating: 5 },
            ];
            return (
                <div key={type} className={`${cfg.theme.fontFamily} relative py-20 px-6`} style={baseStyle}>
                    <SectionBadge label="Testimonials" />
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className={`font-black tracking-tight mb-2 ${isMobile ? "text-2xl" : "text-4xl"}`} style={{ color: headingColor }}>What Customers Say</h2>
                            <p className="text-sm" style={{ color: tCol }}>Real experiences from real customers</p>
                        </div>
                        <div className={`grid gap-5 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
                            {displayTestimonials.slice(0, isMobile ? 1 : 3).map((t, i) => (
                                <div key={i} className="p-6 rounded-3xl border"
                                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }}>
                                    <div className="flex gap-0.5 mb-3">{Array.from({ length: t.rating || 5 }).map((_, idx) => <span key={idx} className="text-amber-400 text-sm">★</span>)}</div>
                                    <p className="text-xs leading-relaxed mb-4" style={{ color: tCol }}>&quot;{t.text}&quot;</p>
                                    <p className="font-black text-xs" style={{ color: headingColor }}>{t.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#060a14] font-sans text-slate-300 flex flex-col gap-4 p-4 lg:p-6">

            {/* QA Checklist Modal */}
            {showQA && (
                <QAChecklistModal
                    cfg={cfg}
                    onConfirm={doSave}
                    onCancel={() => setShowQA(false)}
                    saving={saving}
                />
            )}

            {/* TOP BAR */}
            <header className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl z-20 shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-white leading-tight tracking-tight">Site Builder</h1>
                        <a href={storeUrl} target="_blank" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors">
                            {storeUrl.replace("https://", "")} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <button onClick={() => setPreviewDevice("desktop")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${previewDevice === "desktop" ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}>
                        <Monitor className="w-4 h-4" /> Desktop
                    </button>
                    <button onClick={() => setPreviewDevice("mobile")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${previewDevice === "mobile" ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}>
                        <Smartphone className="w-4 h-4" /> Mobile
                    </button>
                </div>

                <button onClick={handleSave} disabled={saving}
                    className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-black text-sm shadow-lg transition-all active:scale-95 disabled:opacity-60 ${saved ? "bg-emerald-600 text-white shadow-emerald-500/20" : "bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/25"}`}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    {saved ? "Published!" : "Publish Store"}
                </button>
            </header>

            <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">

                {/* SIDEBAR */}
                <aside className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4">
                    <div className="flex bg-slate-900/80 border border-slate-800/60 p-1.5 rounded-xl gap-1.5">
                        <button onClick={() => setActiveTab("design")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${activeTab === "design" ? "bg-emerald-500 text-emerald-950 shadow-md" : "text-slate-500 hover:text-white hover:bg-slate-800"}`}>
                            <Palette className="w-3.5 h-3.5" /> Design & Theme
                        </button>
                        <button onClick={() => setActiveTab("content")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${activeTab === "content" ? "bg-blue-500 text-white shadow-md" : "text-slate-500 hover:text-white hover:bg-slate-800"}`}>
                            <Grid className="w-3.5 h-3.5" /> Layouts & Blocks
                        </button>
                    </div>

                    <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-5 overflow-y-auto custom-scrollbar shadow-2xl">

                        {activeTab === "design" ? (
                            <div className="space-y-8">

                                {/* ── Store Info ── */}
                                <div>
                                    <h3 className="text-white font-black text-sm mb-1 tracking-tight flex items-center gap-2">
                                        <Store className="w-4 h-4 text-emerald-400" /> Store Info
                                    </h3>
                                    <p className="text-slate-500 text-xs mb-4">Your store name and hero text as it appears to customers.</p>
                                    <div className="space-y-3">
                                        <SidebarInput label="Store Name" value={cfg.storeName} onChange={v => { setField("storeName", v); setField("navbarTitle", v); }} placeholder="e.g. Luna Boutique" />
                                        <SidebarInput label="Hero Headline" value={cfg.heroTitle} onChange={v => setField("heroTitle", v)} placeholder="Discover Quality Products…" multiline rows={2} />
                                        <SidebarInput label="Hero Subtitle" value={cfg.heroSubtitle} onChange={v => setField("heroSubtitle", v)} placeholder="Short tagline or description…" multiline rows={2} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <SidebarInput label="Primary CTA" value={cfg.ctaText} onChange={v => setField("ctaText", v)} placeholder="Shop Now" />
                                            <SidebarInput label="Secondary CTA" value={cfg.ctaSecondaryText} onChange={v => setField("ctaSecondaryText", v)} placeholder="Browse Categories" />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Color Mode ── */}
                                <div>
                                    <h3 className="text-white font-black text-sm mb-1 tracking-tight">Color Mode</h3>
                                    <p className="text-slate-500 text-xs mb-4">Applies to both editor preview and published store.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setTheme("darkMode", false)}
                                            className={`relative p-4 rounded-xl text-center border-2 transition-all ${!cfg.theme.darkMode ? "border-emerald-500 bg-slate-50 shadow-lg shadow-emerald-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}>
                                            <Sun className={`w-5 h-5 mx-auto mb-2 ${!cfg.theme.darkMode ? "text-amber-500" : "text-slate-600"}`} />
                                            <div className={`font-black text-sm ${!cfg.theme.darkMode ? "text-slate-900" : "text-slate-500"}`}>Light</div>
                                            <div className={`text-xs mt-0.5 ${!cfg.theme.darkMode ? "text-slate-500" : "text-slate-600"}`}>Clean & Airy</div>
                                            {!cfg.theme.darkMode && <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                                        </button>
                                        <button onClick={() => setTheme("darkMode", true)}
                                            className={`relative p-4 rounded-xl text-center border-2 transition-all ${cfg.theme.darkMode ? "border-emerald-500 bg-slate-950 shadow-lg shadow-emerald-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}>
                                            <Moon className={`w-5 h-5 mx-auto mb-2 ${cfg.theme.darkMode ? "text-blue-400" : "text-slate-600"}`} />
                                            <div className={`font-black text-sm ${cfg.theme.darkMode ? "text-white" : "text-slate-500"}`}>Dark</div>
                                            <div className={`text-xs mt-0.5 ${cfg.theme.darkMode ? "text-slate-400" : "text-slate-600"}`}>Sleek & Bold</div>
                                            {cfg.theme.darkMode && <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                                        </button>
                                    </div>
                                </div>

                                {/* ── Brand Color ── */}
                                <div>
                                    <h3 className="text-white font-black text-sm mb-4 tracking-tight">Brand Color</h3>
                                    <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-200 text-sm">Accent Color</div>
                                            <div className="text-slate-500 text-xs font-mono mt-0.5">{cfg.theme.primaryColor}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg shadow-lg" style={{ backgroundColor: cfg.theme.primaryColor }} />
                                            <label className="w-10 h-10 rounded-xl cursor-pointer border-2 border-dashed border-slate-700 flex items-center justify-center hover:border-slate-500 transition-colors relative">
                                                <Palette className="w-4 h-4 text-slate-500" />
                                                <input type="color" value={cfg.theme.primaryColor}
                                                    onChange={(e) => setTheme("primaryColor", e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-8 gap-2 mt-3">
                                        {["#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b", "#ec4899", "#06b6d4", "#f97316"].map(c => (
                                            <button key={c} onClick={() => setTheme("primaryColor", c)}
                                                className={`w-full aspect-square rounded-lg transition-all hover:scale-110 ${cfg.theme.primaryColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : ""}`}
                                                style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>

                                {/* ── Typography ── */}
                                <div>
                                    <h3 className="text-white font-black text-sm mb-4 tracking-tight">Typography</h3>
                                    <div className="space-y-2">
                                        {FONTS.map(f => (
                                            <button key={f.value} onClick={() => setTheme("fontFamily", f.value)}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${cfg.theme.fontFamily === f.value ? "border-emerald-500 bg-emerald-500/8 text-emerald-400" : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"}`}>
                                                <span className={`font-semibold text-sm ${f.value}`}>{f.name}</span>
                                                <span className={`text-2xl font-black ${f.value}`}>Aa</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="space-y-8">

                                {/* ── Images ── */}
                                <div>
                                    <h3 className="text-white font-black text-sm mb-4 tracking-tight">Branding Images</h3>
                                    <div className="space-y-3">
                                        {[
                                            { ref: logoRef, key: "logoUrl" as const, label: "Store Logo", sublabel: "Square, 512×512 recommended", icon: Store, preview: cfg.logoUrl },
                                            { ref: coverRef, key: "coverUrl" as const, label: "Hero Banner", sublabel: "For split/cover layouts", icon: ImageIcon, preview: cfg.coverUrl }
                                        ].map(item => (
                                            <button key={item.key} onClick={() => item.ref.current?.click()}
                                                className="group w-full flex items-center gap-4 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/50 bg-slate-950 transition-all">
                                                {item.preview ? (
                                                    <img src={item.preview} className="w-12 h-12 rounded-lg object-cover ring-2 ring-emerald-500/30" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 transition-colors border border-dashed border-slate-700">
                                                        <item.icon className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="text-left flex-1">
                                                    <div className="font-bold text-slate-200 text-sm">{item.label}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{item.sublabel}</div>
                                                </div>
                                                <div className="text-xs text-slate-600 group-hover:text-emerald-400 transition-colors font-bold">Upload</div>
                                            </button>
                                        ))}
                                        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e, "logoUrl")} />
                                        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e, "coverUrl")} />
                                    </div>
                                </div>

                                {/* ── Layouts ── */}
                                <div>
                                    <h3 className="text-white font-black text-sm mb-4 tracking-tight">Layout Options</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 block">Hero Style</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[{ v: "split", l: "Split", desc: "Side by side" }, { v: "centered", l: "Center", desc: "Full centered" }, { v: "full", l: "Cover", desc: "Full bleed" }].map(o => (
                                                    <button key={o.v} onClick={() => setLayout("heroLayout", o.v)}
                                                        className={`py-3 px-2 text-xs font-bold rounded-lg border-2 transition-all flex flex-col items-center gap-0.5 ${cfg.layout.heroLayout === o.v ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                                                        <span>{o.l}</span>
                                                        <span className="text-[9px] opacity-60 font-medium">{o.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 block">Features Grid</label>
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {[{ v: "grid-3", l: "3 Columns" }, { v: "grid-4", l: "4 Columns" }].map(o => (
                                                    <button key={o.v} onClick={() => setLayout("featuresLayout", o.v)}
                                                        className={`py-2 text-xs font-bold rounded-lg border-2 transition-all ${cfg.layout.featuresLayout === o.v ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "border-slate-800 text-slate-500 hover:border-slate-700"}`}>
                                                        {o.l}
                                                    </button>
                                                ))}
                                            </div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 block">Features Style</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[{ v: "minimal", l: "Minimal" }, { v: "cards", l: "Cards" }, { v: "accent", l: "Accent" }].map(o => (
                                                    <button key={o.v} onClick={() => setLayout("featuresStyle", o.v)}
                                                        className={`py-2 text-xs font-bold rounded-lg border-2 transition-all ${cfg.layout.featuresStyle === o.v ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "border-slate-800 text-slate-500 hover:border-slate-700"}`}>
                                                        {o.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 block">FAQ Style</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[{ v: "minimal", l: "Minimal" }, { v: "cards", l: "Cards" }, { v: "accent", l: "Accent" }].map(o => (
                                                    <button key={o.v} onClick={() => setLayout("faqStyle", o.v)}
                                                        className={`py-2 text-xs font-bold rounded-lg border-2 transition-all ${cfg.layout.faqStyle === o.v ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "border-slate-800 text-slate-500 hover:border-slate-700"}`}>
                                                        {o.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Section Manager ── */}
                                <div>
                                    <h3 className="text-white font-black text-sm mb-1 tracking-tight">Section Order</h3>
                                    <p className="text-slate-500 text-xs mb-4">Reorder and toggle visibility of page sections.</p>
                                    <div className="space-y-2">
                                        {cfg.sections.order.map((t, i) => {
                                            const isHidden = cfg.sections.hidden.includes(t);
                                            const sectionLabels: Record<string, string> = {
                                                hero: "Hero Banner", categories: "Categories", products: "Products",
                                                trust: "Trust Bar", about: "About Us", testimonials: "Testimonials",
                                                features: "Features", faq: "FAQ", footer: "Footer"
                                            };
                                            return (
                                                <div key={t} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isHidden ? "bg-slate-950 border-slate-800/50 opacity-50" : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600"}`}>
                                                    <GripVertical className="w-4 h-4 text-slate-600 cursor-move flex-shrink-0" />
                                                    <span className={`flex-1 font-bold text-xs ${isHidden ? "text-slate-500 line-through" : "text-slate-200"}`}>
                                                        {sectionLabels[t] || t}
                                                    </span>
                                                    <div className="flex bg-slate-900 rounded-md p-0.5">
                                                        <button onClick={() => moveSec(t as SectionType, "up")} disabled={i === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                                                        <button onClick={() => moveSec(t as SectionType, "down")} disabled={i === cfg.sections.order.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"><ChevronDown className="w-3 h-3" /></button>
                                                    </div>
                                                    <button onClick={() => toggleHide(t as SectionType)}
                                                        className={`p-1.5 rounded-lg border text-xs transition-all ${isHidden ? "border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20" : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"}`}>
                                                        {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ── Advanced Content ── */}
                                <div className="space-y-3">
                                    <h3 className="text-white font-black text-sm mb-4 tracking-tight mt-6">Advanced Content</h3>

                                    {/* About Editor */}
                                    <details className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                                        <summary className="font-bold text-slate-300 text-sm cursor-pointer outline-none p-4 flex items-center justify-between hover:bg-slate-900 transition-colors">
                                            <span className="flex items-center gap-2"><ChevronDown className="w-4 h-4" /> About Section</span>
                                        </summary>
                                        <div className="p-4 pt-0 space-y-3">
                                            <SidebarInput label="About Title" value={cfg.aboutTitle || ""} onChange={v => setField('aboutTitle', v)} placeholder="Our Story" />
                                            <SidebarInput label="About Body" value={cfg.aboutBody || ""} onChange={v => setField('aboutBody', v)} placeholder="Tell your brand story here..." multiline rows={4} />
                                        </div>
                                    </details>

                                    {/* Features Editor */}
                                    <details className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                                        <summary className="font-bold text-slate-300 text-sm cursor-pointer outline-none p-4 flex items-center justify-between hover:bg-slate-900 transition-colors">
                                            <span className="flex items-center gap-2"><ChevronDown className="w-4 h-4" /> Why Choose Us</span>
                                            <span className="text-xs text-slate-500">{cfg.features.length} items</span>
                                        </summary>
                                        <div className="p-4 pt-0 space-y-3">
                                            {cfg.features.map((f, i) => (
                                                <div key={i} className="space-y-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
                                                    <div className="flex gap-2 items-start">
                                                        <div className="flex-1 space-y-2">
                                                            <input value={f.title} onChange={e => updateFeature(i, 'title', e.target.value)}
                                                                className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                                                placeholder="Feature title" />
                                                            <textarea value={f.description} onChange={e => updateFeature(i, 'description', e.target.value)}
                                                                className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-lg text-white resize-none placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                                                rows={2} placeholder="Short description" />
                                                            <select value={f.icon} onChange={e => updateFeature(i, 'icon', e.target.value)}
                                                                className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors">
                                                                {FEATURE_ICON_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                            </select>
                                                        </div>
                                                        <button onClick={() => removeFeature(i)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => setCfg(p => ({ ...p, features: [...p.features, { title: "New Feature", description: "Describe this feature", icon: "Store" }] }))}
                                                className="w-full py-2.5 rounded-lg border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
                                                + Add Feature
                                            </button>
                                        </div>
                                    </details>

                                    {/* Trust Badges Editor */}
                                    <details className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                                        <summary className="font-bold text-slate-300 text-sm cursor-pointer outline-none p-4 flex items-center justify-between hover:bg-slate-900 transition-colors">
                                            <span className="flex items-center gap-2"><ChevronDown className="w-4 h-4" /> Trust Badges</span>
                                            <span className="text-xs text-slate-500">{(cfg.trustBadges || []).length} items</span>
                                        </summary>
                                        <div className="p-4 pt-0 space-y-3">
                                            {(cfg.trustBadges || []).map((b, i) => (
                                                <div key={i} className="space-y-2 p-3 bg-slate-900 rounded-xl border border-slate-800 flex gap-2">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex gap-2">
                                                            <input value={b.label} onChange={e => updateTrustBadge(i, 'label', e.target.value)}
                                                                className="flex-1 bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                                                placeholder="Badge Label" />
                                                            <input value={b.icon} onChange={e => updateTrustBadge(i, 'icon', e.target.value)}
                                                                className="w-16 text-center bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                                                placeholder="Emoji" />
                                                        </div>
                                                        <input value={b.sub || ""} onChange={e => updateTrustBadge(i, 'sub', e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                                            placeholder="Subtext" />
                                                    </div>
                                                    <button onClick={() => removeTrustBadge(i)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0 h-fit">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => setCfg(p => ({ ...p, trustBadges: [...(p.trustBadges || []), { icon: "⭐️", label: "New Badge", sub: "Benefit text" }] }))}
                                                className="w-full py-2.5 rounded-lg border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
                                                + Add Trust Badge
                                            </button>
                                        </div>
                                    </details>

                                    {/* Testimonials Editor */}
                                    <details className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                                        <summary className="font-bold text-slate-300 text-sm cursor-pointer outline-none p-4 flex items-center justify-between hover:bg-slate-900 transition-colors">
                                            <span className="flex items-center gap-2"><ChevronDown className="w-4 h-4" /> Testimonials</span>
                                            <span className="text-xs text-slate-500">{(cfg.testimonials || []).length} items</span>
                                        </summary>
                                        <div className="p-4 pt-0 space-y-3">
                                            {(cfg.testimonials || []).map((t, i) => (
                                                <div key={i} className="space-y-2 p-3 bg-slate-900 rounded-xl border border-slate-800 flex gap-2">
                                                    <div className="flex-1 space-y-2">
                                                        <input value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                                            placeholder="Customer Name" />
                                                        <textarea value={t.text} onChange={e => updateTestimonial(i, 'text', e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-lg text-white resize-none placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                                            rows={2} placeholder="Testimonial Body" />
                                                    </div>
                                                    <button onClick={() => removeTestimonial(i)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0 h-fit">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => setCfg(p => ({ ...p, testimonials: [...(p.testimonials || []), { name: "New Customer", text: "Amazing experience!", rating: 5 }] }))}
                                                className="w-full py-2.5 rounded-lg border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
                                                + Add Testimonial
                                            </button>
                                        </div>
                                    </details>

                                    {/* FAQ Editor */}
                                    <details className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                                        <summary className="font-bold text-slate-300 text-sm cursor-pointer outline-none p-4 flex items-center justify-between hover:bg-slate-900 transition-colors">
                                            <span className="flex items-center gap-2"><ChevronDown className="w-4 h-4" /> FAQs</span>
                                            <span className="text-xs text-slate-500">{cfg.faqs.length} items</span>
                                        </summary>
                                        <div className="p-4 pt-0 space-y-3">
                                            {cfg.faqs.map((f, i) => (
                                                <div key={i} className="space-y-2 p-3 bg-slate-900 rounded-xl border border-slate-800 flex gap-2">
                                                    <div className="flex-1 space-y-2">
                                                        <input value={f.question} onChange={e => updateFaq(i, 'question', e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                                            placeholder="Question" />
                                                        <textarea value={f.answer} onChange={e => updateFaq(i, 'answer', e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-lg text-white resize-none placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                                            rows={2} placeholder="Answer" />
                                                    </div>
                                                    <button onClick={() => removeFaq(i)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0 h-fit">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => setCfg(p => ({ ...p, faqs: [...p.faqs, { question: "New FAQ", answer: "" }] }))}
                                                className="w-full py-2.5 rounded-lg border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
                                                + Add FAQ
                                            </button>
                                        </div>
                                    </details>

                                    <button onClick={handleSave} disabled={saving}
                                        className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-60 active:scale-95 mt-4">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Content Changes
                                    </button>
                                </div>

                                {/* ── Footer & Contact ── */}
                                <div>
                                    <h3 className="text-white font-black text-sm mb-1 tracking-tight flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-emerald-400" /> Footer & Contact Info
                                    </h3>
                                    <p className="text-slate-500 text-xs mb-4">Details shown in your store footer.</p>

                                    {/* Footer Style */}
                                    <div className="mb-5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 block">Footer Style</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: "dark", label: "Modern Dark", bg: "#020617", accent: "#10b981" },
                                                { id: "navy", label: "Deep Navy", bg: "#0f172a", accent: "#6366f1" },
                                                { id: "slate", label: "Charcoal", bg: "#1e293b", accent: "#f59e0b" },
                                            ].map(s => {
                                                const isActive = (cfg as any).footerStyle === s.id;
                                                return (
                                                    <button key={s.id} onClick={() => setField("footerStyle" as any, s.id)}
                                                        className={`relative p-2.5 rounded-xl border-2 text-center transition-all overflow-hidden ${isActive ? "border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20" : "border-slate-800 hover:border-slate-700"}`}>
                                                        <div className="w-full h-6 rounded-md mb-1.5 flex items-end gap-0.5 px-0.5 pb-0.5" style={{ backgroundColor: s.bg }}>
                                                            <div className="flex-1 h-2 rounded-sm opacity-40" style={{ backgroundColor: "white" }} />
                                                            <div className="flex-1 h-1.5 rounded-sm opacity-20" style={{ backgroundColor: "white" }} />
                                                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.accent }} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 leading-tight block">{s.label}</span>
                                                        {isActive && <div className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center"><Check className="w-2 h-2 text-white" /></div>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <SidebarInput label="Email Address" value={cfg.contactEmail || ""} onChange={v => setField('contactEmail', v)} placeholder="hello@yourstore.com" />
                                        <SidebarInput label="Phone Number" value={cfg.contactPhone || ""} onChange={v => setField('contactPhone', v)} placeholder="+92 300 000 0000" />
                                    </div>

                                    <div className="space-y-3 mb-5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Social Media Links</label>
                                        {[
                                            { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourstore", color: "#e1306c" },
                                            { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourstore", color: "#1877f2" },
                                            { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/yourstore", color: "#1da1f2" },
                                            { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/92300000000", color: "#25d366" },
                                        ].map(s => (
                                            <div key={s.key}>
                                                <label className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5 block">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                                    {s.label}
                                                </label>
                                                <input value={(cfg.socialLinks as any)?.[s.key] || ""}
                                                    onChange={e => setField('socialLinks', { ...cfg.socialLinks, [s.key]: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 text-xs p-2.5 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                                    placeholder={s.placeholder} />
                                            </div>
                                        ))}
                                    </div>

                                    <button onClick={handleSave} disabled={saving}
                                        className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 disabled:opacity-60 active:scale-95">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Footer Details
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>
                </aside>

                {/* PREVIEW CANVAS */}
                <div className="flex-1 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-3 lg:p-4 overflow-hidden shadow-2xl flex flex-col items-center">
                    <div className="w-full max-w-xs mx-auto mb-4 bg-slate-800/80 rounded-full px-4 py-2 flex items-center justify-between shadow-inner border border-slate-700/50">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 font-mono tracking-widest">{previewDevice.toUpperCase()} PREVIEW</div>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    </div>

                    <div className={`transition-all duration-500 ease-in-out rounded-2xl shadow-2xl overflow-y-auto custom-scrollbar flex-1 relative ${previewDevice === "mobile" ? "w-[390px]" : "w-full"}`}
                        style={{ backgroundColor: bCol }}>
                        {cfg.sections.order.map(s => renderSection(s as SectionType, previewDevice === "mobile"))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #334155; }
                details > summary { list-style: none; }
                details > summary::-webkit-details-marker { display: none; }
            `}</style>
        </div>
    );
}