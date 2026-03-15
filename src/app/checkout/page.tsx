"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle,
    ShoppingBag,
    User,
    Phone,
    MapPin,
    CreditCard,
    Loader2,
    AlertCircle,
    Building2,
    FileText,
    Store,
    Moon,
    Sun,
    ChevronRight,
    ShieldCheck,
    ArrowRight,
    Truck,
    Banknote,
    Smartphone,
    Package,
    Sparkles,
    Check
} from "lucide-react";
import { useCart } from "@/stores/cartStore";

type PaymentMethod = "COD" | "online" | "bank_transfer";

interface OrderResult {
    orderNumber: string;
    totalAmount: number;
    currency: string;
}

interface StoreInfo {
    primaryColor?: string;
    navbarTitle?: string;
    storeName?: string;
    logoUrl?: string;
    fontFamily?: string;
    darkMode?: boolean;
}

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const slug = searchParams.get("store") || "";
    const phoneParam = searchParams.get("phone") || "";

    const { items, getSubtotal, clearCart } = useCart();
    const subtotal = getSubtotal();

    const [theme, setTheme] = useState("light");
    const [storeInfo, setStoreInfo] = useState<StoreInfo>({});
    const [form, setForm] = useState({
        name: "",
        phone: phoneParam,
        address: "",
        city: "",
        paymentMethod: "COD" as PaymentMethod,
        notes: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState("");
    const [order, setOrder] = useState<OrderResult | null>(null);
    const [activeStep, setActiveStep] = useState(1);

    useEffect(() => {
        const saved = slug ? localStorage.getItem(`store_theme_${slug}`) : null;
        if (saved) setTheme(saved);
        else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");

        if (phoneParam) setForm((f) => ({ ...f, phone: phoneParam }));

        // Fetch store info for consistent theming
        if (slug) {
            fetch(`/api/store/${slug}`)
                .then(r => r.json())
                .then(data => {
                    if (!data.error && data.business?.storefront) {
                        const sf = data.business.storefront;
                        setStoreInfo({
                            primaryColor: sf.theme?.primaryColor,
                            navbarTitle: sf.navbarTitle || sf.storeName || data.business.name,
                            storeName: sf.storeName || data.business.name,
                            logoUrl: sf.logoUrl,
                            fontFamily: sf.theme?.fontFamily,
                            darkMode: sf.theme?.darkMode,
                        });
                        if (!saved) {
                            if (sf.theme?.darkMode) setTheme("dark");
                        }
                    }
                })
                .catch(() => { });
        }
    }, [phoneParam, slug]);

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        if (slug) localStorage.setItem(`store_theme_${slug}`, next);
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = "Full name is required";
        if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 7)
            errs.phone = "A valid phone number is required";
        if (!form.address.trim() || form.address.trim().length < 5)
            errs.address = "Please enter your full address";
        if (!form.city.trim()) errs.city = "City is required";
        return errs;
    };

    const handleChange = (field: string, value: string) => {
        setForm((f) => ({ ...f, [field]: value }));
        if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); setActiveStep(1); return; }
        if (items.length === 0) { setApiError("Your cart is empty."); return; }

        setSubmitting(true);
        setApiError("");

        try {
            const payload = {
                name: form.name.trim(),
                phone: form.phone.replace(/\D/g, ""),
                address: form.address.trim(),
                city: form.city.trim(),
                paymentMethod: form.paymentMethod,
                notes: form.notes.trim() || undefined,
                items: items.map((i) => ({
                    productId: i.productId,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    variant: i.variant,
                })),
            };

            const res = await fetch(`/api/store/${slug}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                setApiError(data.error || "Failed to place order. Please try again.");
                return;
            }

            clearCart();
            setOrder({
                orderNumber: data.order.orderNumber,
                totalAmount: data.order.totalAmount,
                currency: data.order.currency,
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
            setApiError("Network error. Please check your connection and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Theme Variables ───────────────────────────────────────────────────────
    const isDark = theme === "dark";
    const pCol = storeInfo.primaryColor || "#10b981";
    // Headings always white in dark, near-black in light
    const headingColor = isDark ? "#ffffff" : "#0f172a";
    const tCol = isDark ? "#94a3b8" : "#475569";
    const bCol = isDark ? "#0f172a" : "#f8fafc";
    const cardBg = isDark ? "#131e31" : "#ffffff";
    const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc";
    const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    const navBg = isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.92)";
    const fontClass = storeInfo.fontFamily || "font-sans";
    const navTitle = storeInfo.navbarTitle || storeInfo.storeName || "Store";

    // ─── Order Success Screen ──────────────────────────────────────────────────
    if (order) {
        return (
            <div className={`${fontClass} min-h-screen transition-colors duration-300 flex flex-col`}
                style={{ backgroundColor: bCol }}>
                {/* Navbar */}
                <header className="sticky top-0 z-50 backdrop-blur-xl border-b"
                    style={{ backgroundColor: navBg, borderColor }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {storeInfo.logoUrl ? (
                                <img src={storeInfo.logoUrl} alt={navTitle} className="w-9 h-9 rounded-xl object-cover shadow" />
                            ) : (
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black shadow-lg"
                                    style={{ backgroundColor: pCol }}>
                                    {navTitle.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="font-extrabold text-base hidden sm:block" style={{ color: headingColor }}>{navTitle}</span>
                        </div>
                        <button onClick={toggleTheme}
                            className="p-2.5 rounded-full transition-all hover:scale-105"
                            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex items-center justify-center py-16 px-4">
                    <div className="max-w-lg w-full">
                        {/* Success Card */}
                        <div className="rounded-[2.5rem] p-8 md:p-12 shadow-2xl border relative overflow-hidden"
                            style={{ backgroundColor: cardBg, borderColor }}>
                            {/* Decorative top strip */}
                            <div className="absolute top-0 left-0 right-0 h-2 rounded-t-[2.5rem]" style={{ backgroundColor: pCol }} />
                            <div className="absolute top-0 left-0 right-0 h-32 opacity-10 rounded-t-[2.5rem]"
                                style={{ background: `linear-gradient(135deg, ${pCol}, transparent)` }} />

                            {/* Checkmark Icon */}
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-2xl"
                                    style={{ backgroundColor: `${pCol}20`, border: `4px solid ${pCol}30` }}>
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: pCol }}>
                                        <Check className="w-8 h-8 text-white" strokeWidth={3} />
                                    </div>
                                </div>

                                <h1 className="text-4xl font-black mb-3 tracking-tight" style={{ color: headingColor }}>
                                    Order Confirmed!
                                </h1>
                                <p className="text-base font-medium leading-relaxed mb-10 max-w-sm" style={{ color: tCol }}>
                                    Thank you for your purchase. We&apos;ve sent a confirmation to your WhatsApp.
                                </p>

                                {/* Order Details Card */}
                                <div className="w-full rounded-2xl p-6 mb-6 border text-left"
                                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderColor }}>
                                    <div className="flex justify-between items-center pb-4 mb-4 border-b" style={{ borderColor }}>
                                        <div className="flex items-center gap-2" style={{ color: tCol }}>
                                            <FileText className="w-4 h-4" />
                                            <span className="text-sm font-semibold">Order Number</span>
                                        </div>
                                        <span className="font-black text-lg" style={{ color: headingColor }}>
                                            #{order.orderNumber}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-sm" style={{ color: tCol }}>Total Amount</span>
                                        <span className="font-black text-2xl" style={{ color: pCol }}>
                                            {order.currency} {order.totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="w-full flex items-start gap-3 rounded-2xl p-4 mb-8 text-left"
                                    style={{ backgroundColor: `${pCol}12`, border: `1px solid ${pCol}30` }}>
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: pCol }} />
                                    <p className="text-sm font-medium" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                        Track your order by sending{" "}
                                        <strong className="font-black font-mono px-1.5 py-0.5 rounded text-sm"
                                            style={{ backgroundColor: `${pCol}25`, color: pCol }}>
                                            #{order.orderNumber}
                                        </strong>{" "}
                                        to our WhatsApp number.
                                    </p>
                                </div>

                                {slug && (
                                    <Link href={`/store/${slug}`}
                                        className="w-full py-4 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 shadow-xl"
                                        style={{ backgroundColor: pCol, boxShadow: `0 20px 40px -10px ${pCol}50` }}>
                                        Continue Shopping <ArrowRight className="w-5 h-5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Input Style Helper ────────────────────────────────────────────────────
    const inputClass = (field: string) =>
        `w-full rounded-xl px-4 py-3.5 text-base font-medium focus:outline-none focus:ring-2 transition-all placeholder:font-normal`;
    const inputStyle = (field: string): React.CSSProperties => ({
        backgroundColor: inputBg,
        border: `1.5px solid ${errors[field] ? "#ef4444" : inputBorder}`,
        color: headingColor,
        outlineColor: pCol,
    });

    // ─── Checkout Form ─────────────────────────────────────────────────────────
    return (
        <div className={`${fontClass} min-h-screen transition-colors duration-300 flex flex-col`}
            style={{ backgroundColor: bCol }}>

            {/* NAVBAR */}
            <header className="sticky top-0 z-50 backdrop-blur-xl border-b shadow-sm transition-all"
                style={{ backgroundColor: navBg, borderColor }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/cart"
                                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex items-center gap-3">
                                {storeInfo.logoUrl ? (
                                    <img src={storeInfo.logoUrl} alt={navTitle} className="w-9 h-9 rounded-xl object-cover shadow" />
                                ) : slug ? (
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black shadow"
                                        style={{ backgroundColor: pCol }}>
                                        {navTitle.charAt(0).toUpperCase()}
                                    </div>
                                ) : null}
                                <div>
                                    <h1 className="text-base font-black leading-tight" style={{ color: headingColor }}>
                                        Secure Checkout
                                    </h1>
                                    {slug && (
                                        <p className="text-xs font-medium" style={{ color: tCol }}>
                                            {navTitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
                                style={{ color: tCol }}>
                                <ShieldCheck className="w-4 h-4" style={{ color: pCol }} />
                                Secure
                            </div>
                            <button onClick={toggleTheme}
                                className="p-2.5 rounded-full transition-all hover:scale-105"
                                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-8"
                    style={{ color: tCol }}>
                    <Link href={slug ? `/store/${slug}` : "/"}
                        className="transition-colors hover:opacity-100"
                        style={{ opacity: 0.6 }}
                        onMouseEnter={e => (e.currentTarget.style.color = pCol)}
                        onMouseLeave={e => (e.currentTarget.style.color = tCol)}>
                        Store
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                    <Link href="/cart"
                        className="transition-colors"
                        style={{ opacity: 0.6 }}
                        onMouseEnter={e => (e.currentTarget.style.color = pCol)}
                        onMouseLeave={e => (e.currentTarget.style.color = tCol)}>
                        Cart
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                    <span style={{ color: headingColor, opacity: 1 }}>Checkout</span>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-3 mb-10">
                    {[
                        { step: 1, label: "Delivery" },
                        { step: 2, label: "Payment" },
                        { step: 3, label: "Confirm" },
                    ].map((s, i) => (
                        <div key={s.step} className="flex items-center gap-3 flex-1">
                            <button onClick={() => setActiveStep(s.step)}
                                className="flex items-center gap-2.5 group">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all"
                                    style={activeStep >= s.step
                                        ? { backgroundColor: pCol, color: "#fff" }
                                        : { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", color: tCol }}>
                                    {activeStep > s.step ? <Check className="w-4 h-4" strokeWidth={3} /> : s.step}
                                </div>
                                <span className="text-sm font-bold hidden sm:block transition-colors"
                                    style={{ color: activeStep >= s.step ? headingColor : tCol }}>
                                    {s.label}
                                </span>
                            </button>
                            {i < 2 && (
                                <div className="flex-1 h-px transition-colors"
                                    style={{ backgroundColor: activeStep > s.step ? pCol : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">

                    {/* LEFT: Form */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Step 1: Delivery Info */}
                            <div className="rounded-[2rem] p-6 sm:p-8 border shadow-sm transition-all"
                                style={{ backgroundColor: cardBg, borderColor }}>
                                <h2 className="text-lg font-black mb-6 flex items-center gap-3 tracking-tight" style={{ color: headingColor }}>
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${pCol}18`, color: pCol }}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    Delivery Information
                                </h2>

                                <div className="space-y-4">
                                    {/* Name & Phone */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: tCol }}>
                                                <User className="w-3.5 h-3.5" /> Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => handleChange("name", e.target.value)}
                                                placeholder="e.g. Ali Khan"
                                                className={inputClass("name")}
                                                style={inputStyle("name")}
                                            />
                                            {errors.name && (
                                                <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {errors.name}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: tCol }}>
                                                <Phone className="w-3.5 h-3.5" /> WhatsApp Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                onChange={(e) => handleChange("phone", e.target.value)}
                                                placeholder="e.g. 923001234567"
                                                className={inputClass("phone")}
                                                style={inputStyle("phone")}
                                            />
                                            {errors.phone ? (
                                                <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {errors.phone}
                                                </p>
                                            ) : (
                                                <p className="text-xs font-medium mt-1.5 flex items-center gap-1" style={{ color: tCol }}>
                                                    <CheckCircle className="w-3 h-3" style={{ color: pCol }} /> Order updates sent here
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-wider mb-2 block" style={{ color: tCol }}>
                                            Street Address
                                        </label>
                                        <input
                                            type="text"
                                            value={form.address}
                                            onChange={(e) => handleChange("address", e.target.value)}
                                            placeholder="House 123, Street 4, Block B, Area"
                                            className={inputClass("address")}
                                            style={inputStyle("address")}
                                        />
                                        {errors.address && (
                                            <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> {errors.address}
                                            </p>
                                        )}
                                    </div>

                                    {/* City & Notes */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: tCol }}>
                                                <Building2 className="w-3.5 h-3.5" /> City
                                            </label>
                                            <input
                                                type="text"
                                                value={form.city}
                                                onChange={(e) => handleChange("city", e.target.value)}
                                                placeholder="e.g. Lahore"
                                                className={inputClass("city")}
                                                style={inputStyle("city")}
                                            />
                                            {errors.city && (
                                                <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {errors.city}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: tCol }}>
                                                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Notes</span>
                                                <span className="text-xs font-medium opacity-50">Optional</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={form.notes}
                                                onChange={(e) => handleChange("notes", e.target.value)}
                                                placeholder="Special instructions…"
                                                className={inputClass("notes")}
                                                style={{
                                                    backgroundColor: inputBg,
                                                    border: `1.5px solid ${inputBorder}`,
                                                    color: headingColor,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Payment Method */}
                            <div className="rounded-[2rem] p-6 sm:p-8 border shadow-sm"
                                style={{ backgroundColor: cardBg, borderColor }}>
                                <h2 className="text-lg font-black mb-6 flex items-center gap-3 tracking-tight" style={{ color: headingColor }}>
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${pCol}18`, color: pCol }}>
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    Payment Method
                                </h2>

                                <div className="space-y-3">
                                    {[
                                        {
                                            value: "COD",
                                            label: "Cash on Delivery",
                                            desc: "Pay when your order arrives at your doorstep",
                                            icon: Banknote,
                                            color: "#10b981"
                                        },
                                        {
                                            value: "bank_transfer",
                                            label: "Bank Transfer",
                                            desc: "Transfer directly to our account before dispatch",
                                            icon: Building2,
                                            color: "#3b82f6"
                                        },
                                        {
                                            value: "online",
                                            label: "Online Payment",
                                            desc: "Credit / Debit Card, EasyPaisa, or JazzCash",
                                            icon: Smartphone,
                                            color: "#8b5cf6"
                                        },
                                    ].map((opt) => {
                                        const isSelected = form.paymentMethod === opt.value;
                                        return (
                                            <label key={opt.value}
                                                className="flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all"
                                                style={{
                                                    borderColor: isSelected ? opt.color : borderColor,
                                                    backgroundColor: isSelected
                                                        ? `${opt.color}10`
                                                        : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.01)"
                                                }}>
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                                                    style={{ backgroundColor: isSelected ? `${opt.color}20` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: isSelected ? opt.color : tCol }}>
                                                    <opt.icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-sm mb-1 transition-colors"
                                                        style={{ color: isSelected ? opt.color : headingColor }}>
                                                        {opt.label}
                                                    </p>
                                                    <p className="text-xs font-medium leading-relaxed" style={{ color: tCol }}>
                                                        {opt.desc}
                                                    </p>
                                                </div>
                                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all"
                                                    style={{ borderColor: isSelected ? opt.color : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", backgroundColor: isSelected ? opt.color : "transparent" }}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                </div>
                                                <input type="radio" name="payment" value={opt.value}
                                                    checked={isSelected}
                                                    onChange={() => handleChange("paymentMethod", opt.value)}
                                                    className="sr-only" />
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* API Error */}
                            {apiError && (
                                <div className="flex items-start gap-3 rounded-2xl p-4 border"
                                    style={{ backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p className="font-medium text-sm">{apiError}</p>
                                </div>
                            )}

                            {/* Mobile Submit Button */}
                            <button type="submit"
                                disabled={submitting || items.length === 0}
                                className="lg:hidden w-full py-4 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: pCol, boxShadow: `0 20px 40px -10px ${pCol}40` }}>
                                {submitting
                                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                                    : <><CheckCircle className="w-5 h-5" /> Confirm Order</>}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: Order Summary */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <div className="rounded-[2rem] p-6 lg:p-8 border shadow-2xl sticky top-24"
                            style={{ backgroundColor: cardBg, borderColor }}>
                            <h2 className="text-lg font-black mb-6 flex items-center gap-3 tracking-tight" style={{ color: headingColor }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${pCol}18`, color: pCol }}>
                                    <Package className="w-5 h-5" />
                                </div>
                                Order Summary
                            </h2>

                            {/* Items */}
                            <div className="space-y-3 mb-6 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                {items.length === 0 ? (
                                    <div className="text-center py-8" style={{ color: tCol }}>
                                        <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-medium opacity-60">Your cart is empty</p>
                                    </div>
                                ) : items.map((item) => (
                                    <div key={`${item.productId}-${item.variant}`} className="flex gap-3.5 items-center py-2">
                                        <div className="w-14 h-14 rounded-xl flex-shrink-0 relative overflow-hidden border"
                                            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", borderColor }}>
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag className="w-5 h-5" style={{ color: tCol, opacity: 0.4 }} />
                                                </div>
                                            )}
                                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                                                style={{ backgroundColor: pCol }}>
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate" style={{ color: headingColor }}>{item.name}</p>
                                            {item.variant && (
                                                <p className="text-xs font-medium mt-0.5" style={{ color: tCol }}>{item.variant}</p>
                                            )}
                                        </div>
                                        <span className="text-sm font-black flex-shrink-0" style={{ color: headingColor }}>
                                            {(item.price * item.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 pt-5 border-t mb-5" style={{ borderColor }}>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold" style={{ color: tCol }}>Subtotal</span>
                                    <span className="font-bold" style={{ color: headingColor }}>PKR {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold" style={{ color: tCol }}>Shipping</span>
                                    <span className="font-semibold text-xs uppercase tracking-wider px-2 py-1 rounded-lg"
                                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                                        Calculated at dispatch
                                    </span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-end pt-5 pb-6 border-t" style={{ borderColor }}>
                                <span className="font-black text-lg" style={{ color: headingColor }}>Total</span>
                                <div className="text-right">
                                    <span className="text-3xl font-black" style={{ color: pCol }}>
                                        {subtotal.toLocaleString()}
                                    </span>
                                    <span className="text-sm font-bold ml-1.5" style={{ color: pCol, opacity: 0.7 }}>PKR</span>
                                </div>
                            </div>

                            {/* Desktop Submit */}
                            <button
                                onClick={(e) => handleSubmit()}
                                disabled={submitting || items.length === 0}
                                className="w-full py-4 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                style={{ backgroundColor: pCol, boxShadow: `0 20px 40px -10px ${pCol}40` }}>
                                {submitting
                                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                                    : <><CheckCircle className="w-5 h-5" /> Confirm Order</>}
                            </button>

                            {/* Trust Row */}
                            <div className="flex items-center justify-center gap-4 mt-5">
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: tCol, opacity: 0.6 }}>
                                    <ShieldCheck className="w-3.5 h-3.5" /> Secure
                                </div>
                                <div className="w-px h-4" style={{ backgroundColor: borderColor }} />
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: tCol, opacity: 0.6 }}>
                                    <Truck className="w-3.5 h-3.5" /> Fast Delivery
                                </div>
                                <div className="w-px h-4" style={{ backgroundColor: borderColor }} />
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: tCol, opacity: 0.6 }}>
                                    <Sparkles className="w-3.5 h-3.5" /> Quality
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? "#1e293b" : "#cbd5e1"}; border-radius: 10px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: ${isDark ? "#334155" : "#94a3b8"}; }
                input::placeholder { opacity: 0.5; }
            `}</style>
        </div>
    );
}