"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ShoppingCart, Store, ArrowRight, Phone, Mail, MapPin,
    ChevronDown, ChevronUp, Moon, Sun, Search,
    Facebook, Instagram, Twitter, ShieldCheck, Truck, HeadphonesIcon,
    Menu, X, Sparkles, ArrowLeft, Star, Quote,
    CheckCircle, RotateCcw, Eye, MessageCircle, ChevronUp as ChevronUpIcon,
    ArrowUp
} from "lucide-react";
import { useCart } from "@/stores/cartStore";

/* ─── Types ─────────────────────────────────────────────────── */
interface Testimonial { name: string; text: string; rating: number; avatar?: string; }
interface TrustBadge { icon: string; label: string; sub: string; }
interface AboutStat { value: string; label: string; }

interface Storefront {
    logoUrl?: string; coverUrl?: string;
    storeName?: string; navbarTitle?: string;
    heroTitle?: string; heroSubtitle?: string; heroAlign?: "center" | "left";
    ctaText?: string; ctaSecondaryText?: string;
    footerText?: string; footerDescription?: string;
    contactInfo?: string; contactEmail?: string; contactPhone?: string;
    features?: { title: string; description: string; icon: string }[];
    faqs?: { question: string; answer: string }[];
    testimonials?: Testimonial[];
    aboutTitle?: string; aboutBody?: string; aboutStats?: AboutStat[];
    theme?: { primaryColor?: string; textColor?: string; bgColor?: string; fontFamily?: string; darkMode?: boolean; themeMode?: "light" | "dark" | "minimal"; };
    layout?: {
        heroLayout?: "split" | "centered" | "full";
        featuresLayout?: "grid-3" | "grid-4";
        featuresStyle?: "minimal" | "cards" | "accent";
        faqStyle?: "minimal" | "cards" | "accent";
    };
    sections?: { order?: string[]; hidden?: string[]; };
    socialLinks?: { facebook?: string; instagram?: string; twitter?: string; whatsapp?: string; };
    trustBadges?: TrustBadge[];
    footerStyle?: "dark" | "navy" | "slate";
}

interface Product {
    _id: string; name: string; description?: string; price: number; currency: string;
    imageUrl?: string; images?: { publicId: string; secureUrl: string }[];
    inStock: boolean; stockQuantity: number;
    discount?: { type: string; value: number };
    variants?: any[]; category?: string; categoryId?: string;
}

interface Category { _id: string; name: string; emoji: string; }

interface Business {
    _id: string; name: string; slug: string; description?: string;
    address?: string; contactPhone?: string;
    settings?: { currency?: string };
    storefront?: Storefront;
    policies?: {
        delivery?: { enabled: boolean; description?: string; timeframe?: string; };
        refund?: { enabled: boolean; description?: string; conditions?: string; durationDays?: number };
        payment?: { methods: string[]; instructions?: string };
    };
}

/* ─── Helpers & defaults ─────────────────────────────────────── */
const getImage = (p: Product) => p.images?.[0]?.secureUrl || p.imageUrl || null;
const getEffectivePrice = (p: Product) => {
    if (!p.discount?.value) return p.price;
    return p.discount.type === "percentage"
        ? p.price - (p.price * p.discount.value) / 100
        : p.price - p.discount.value;
};

const DEFAULT_TESTIMONIALS: Testimonial[] = [
    { name: "Sarah M.", text: "Absolutely love this store! Products arrived quickly and the quality exceeded my expectations.", rating: 5 },
    { name: "Ahmed K.", text: "Super easy to order via WhatsApp. The team was responsive and helpful throughout the process.", rating: 5 },
    { name: "Fatima R.", text: "Great prices and authentic products. Will definitely be a returning customer!", rating: 5 },
    { name: "James T.", text: "Seamless shopping experience. Loved the fast delivery and beautiful packaging.", rating: 5 },
];

const DEFAULT_TRUST: TrustBadge[] = [
    { icon: "ShieldCheck", label: "Secure Checkout", sub: "100% Protected" },
    { icon: "MessageCircle", label: "WhatsApp Verified", sub: "Instant Support" },
    { icon: "Truck", label: "Fast Delivery", sub: "2–6 Business Days" },
    { icon: "RotateCcw", label: "Easy Returns", sub: "Hassle-free Policy" },
];

const TRUST_ICONS: Record<string, any> = { ShieldCheck, Truck, RotateCcw, MessageCircle, HeadphonesIcon };

/* ─── Stars ──────────────────────────────────────────────────── */
function Stars({ n }: { n: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-3.5 h-3.5" fill={i <= n ? "#f59e0b" : "none"} stroke={i <= n ? "#f59e0b" : "#94a3b8"} />
            ))}
        </div>
    );
}

/* ─── Scroll-reveal section ──────────────────────────────────── */
function FadeSection({ children, className, style }: {
    children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
        }, { threshold: 0.08 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} className={className} style={style}>
            <div className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                {children}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function StorefrontPage() {
    const { slug } = useParams<{ slug: string }>();
    const [business, setBusiness] = useState<Business | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const { getItemCount, addItem } = useCart();
    const [addedId, setAddedId] = useState<string | null>(null);
    const [theme, setTheme] = useState("light");
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [activeSection, setActiveSection] = useState("hero");
    const [scrolled, setScrolled] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [heroVisible, setHeroVisible] = useState(false);
    const testimonialRef = useRef<HTMLDivElement>(null);
    const [activeDot, setActiveDot] = useState(0);

    useEffect(() => {
        fetch(`/api/store/${slug}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { setError(data.error); return; }
                const biz = data.business;
                setBusiness(biz);
                setProducts(data.products || []);
                setCategories(data.categories || []);
                const saved = localStorage.getItem(`store_theme_${slug}`);
                if (saved) setTheme(saved);
                else if (biz?.storefront?.theme?.darkMode) setTheme("dark");
                else if (biz?.storefront?.theme?.themeMode) setTheme(biz.storefront.theme.themeMode);
                else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
            })
            .catch(() => setError("Failed to load store."))
            .finally(() => {
                setLoading(false);
                // Trigger hero entrance animation
                setTimeout(() => setHeroVisible(true), 80);
            });
    }, [slug]);

    // Scroll tracking
    useEffect(() => {
        const onScroll = () => {
            const sy = window.scrollY;
            setScrolled(sy > 20);
            setShowScrollTop(sy > 400);
            const ids = ["hero", "categories", "products", "trust", "about", "testimonials", "features", "faq", "footer"];
            for (const id of ids) {
                const el = document.getElementById(id);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 100 && rect.bottom > 0) { setActiveSection(id); break; }
                }
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Testimonial dot tracking
    useEffect(() => {
        const el = testimonialRef.current;
        if (!el) return;
        const onScroll = () => {
            const cardW = el.scrollWidth / Math.max(1, el.children.length);
            setActiveDot(Math.round(el.scrollLeft / cardW));
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        localStorage.setItem(`store_theme_${slug}`, next);
    };

    const handleQuickAdd = (p: Product) => {
        if (!business) return;
        addItem({
            productId: p._id, name: p.name, price: getEffectivePrice(p),
            quantity: 1, imageUrl: getImage(p) || undefined,
            businessSlug: business.slug, businessId: business._id
        });
        setAddedId(p._id);
        setTimeout(() => setAddedId(null), 1500);
    };

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    /* ─── Derived values ──────────────────────────────────────── */
    const sf = business?.storefront || {};
    const currency = business?.settings?.currency || "PKR";
    const itemCount = getItemCount();
    const navTitle = sf.navbarTitle || sf.storeName || business?.name || "Store";
    const heroTitle = sf.heroTitle || "Discover Quality Products You'll Love";
    const heroSubtitle = sf.heroSubtitle || "We bring you carefully selected products designed to make everyday life better.";
    const ctaText = sf.ctaText || "Shop Now";
    const ctaSecondaryText = sf.ctaSecondaryText || "Browse Categories";
    const footerText = sf.footerText || `© ${new Date().getFullYear()} ${business?.name}. All rights reserved.`;
    const sectionOrder = (sf.sections?.order?.length
        ? sf.sections.order
        : ["hero", "categories", "products", "trust", "about", "testimonials", "features", "faq", "footer"]) as string[];
    const hiddenSections = sf.sections?.hidden || [];
    const testimonials = sf.testimonials?.length ? sf.testimonials : DEFAULT_TESTIMONIALS;
    const trustBadges = sf.trustBadges?.length ? sf.trustBadges : DEFAULT_TRUST;
    const features = sf.features?.length ? sf.features : [
        { title: "Fast Delivery", description: "Quick and reliable shipping to your doorstep.", icon: "Truck" },
        { title: "Quality Products", description: "We carefully select products to ensure the best experience.", icon: "ShieldCheck" },
        { title: "Customer Support", description: "Our team is here to help whenever you need assistance.", icon: "HeadphonesIcon" }
    ];
    const FEATURE_ICONS: Record<string, any> = { Truck, ShieldCheck, HeadphonesIcon, Phone, Store, RotateCcw, MessageCircle };
    const aboutTitle = sf.aboutTitle || "Our Story";
    const aboutBody = sf.aboutBody || "We are passionate about bringing you the finest products with a seamless shopping experience. Built on trust, powered by WhatsApp — every order is handled personally by our team.";
    const aboutStats: AboutStat[] = sf.aboutStats?.length ? sf.aboutStats : [
        { value: "500+", label: "Happy Customers" }, { value: "4.9★", label: "Avg Rating" }, { value: "2–6d", label: "Delivery" }
    ];

    const buildFaqs = () => {
        const custom = sf.faqs || [];
        const auto: { question: string; answer: string }[] = [];
        if (business?.policies) {
            const { delivery, refund, payment } = business.policies;
            if (delivery?.enabled && (delivery.timeframe || delivery.description))
                auto.push({ question: "How long does delivery take?", answer: `${delivery.timeframe ? delivery.timeframe + ". " : ""}${delivery.description || ""}` });
            if (payment?.methods?.length)
                auto.push({ question: "What payment methods are accepted?", answer: `We accept: ${payment.methods.map(m => m.toUpperCase()).join(", ")}. ${payment.instructions || ""}` });
            if (refund?.enabled)
                auto.push({ question: "Can I return a product?", answer: `Yes, within ${refund.durationDays || 7} days. ${refund.conditions || refund.description || ""}` });
        }
        const all = [...custom, ...auto];
        return all.length > 0 ? all : [
            { question: "How long does delivery take?", answer: "Delivery usually takes 2–6 business days depending on your location." },
            { question: "What payment methods do you accept?", answer: "We accept Cash on Delivery and other convenient payment options." },
            { question: "Can I track my order?", answer: "Yes! You'll receive live updates about your order directly via WhatsApp." },
            { question: "Do you offer returns?", answer: "Absolutely. We offer hassle-free returns within 7 days of delivery." },
        ];
    };
    const faqs = buildFaqs();

    const filtered = products
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .filter(p => selectedCategoryId ? p.categoryId === selectedCategoryId : true);

    /* ─── Theme ───────────────────────────────────────────────── */
    const isDark = theme === "dark";
    const isMinimal = theme === "minimal";
    const pCol = sf.theme?.primaryColor || "#10b981";
    const headingColor = isDark ? "#ffffff" : "#0f172a";
    const tCol = isDark ? "#94a3b8" : (sf.theme?.textColor || "#475569");
    const bCol = isDark ? "#0f172a" : isMinimal ? "#f9fafb" : (sf.theme?.bgColor || "#ffffff");
    const cardBg = isDark ? "rgba(255,255,255,0.035)" : "#ffffff";
    const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const navBg = isDark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.88)";
    const sectionAltBg = isDark ? "#0a1628" : isMinimal ? "#f1f5f9" : "#f8fafc";
    const fontClass = sf.theme?.fontFamily || "font-sans";

    const navLinks = [
        { id: "hero", label: "Home" },
        ...(categories.length > 0 && !hiddenSections.includes("categories") ? [{ id: "categories", label: "Categories" }] : []),
        ...(!hiddenSections.includes("products") ? [{ id: "products", label: "Products" }] : []),
        ...(!hiddenSections.includes("about") ? [{ id: "about", label: "About" }] : []),
        ...(!hiddenSections.includes("faq") ? [{ id: "faq", label: "FAQ" }] : []),
    ];

    /* ─── Loading ─────────────────────────────────────────────── */
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bCol }}>
            <div className="flex flex-col items-center gap-5">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 animate-spin"
                        style={{ borderColor: `${pCol}30`, borderTopColor: pCol }} />
                    <div className="absolute inset-0 rounded-full border-4 animate-ping opacity-20"
                        style={{ borderColor: pCol }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Store className="w-6 h-6" style={{ color: pCol }} />
                    </div>
                </div>
                <p className="text-sm font-semibold animate-pulse" style={{ color: tCol }}>Loading store…</p>
            </div>
        </div>
    );

    if (error || !business) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bCol }}>
            <div className="text-center p-10 rounded-3xl shadow-2xl w-full max-w-md border"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${pCol}18` }}>
                    <Store className="w-8 h-8" style={{ color: pCol }} />
                </div>
                <h1 className="text-2xl font-black mb-2" style={{ color: headingColor }}>Store Not Found</h1>
                <p style={{ color: tCol }}>{error}</p>
            </div>
        </div>
    );

    /* ─── Navbar ──────────────────────────────────────────────── */
    const Navbar = (
        <header className="sticky top-0 z-50 transition-all duration-300"
            style={{
                backgroundColor: navBg,
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.10)" : "none",
            }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center"
                    style={{ height: scrolled ? "62px" : "72px", transition: "height 0.3s ease" }}>
                    <div className="flex items-center gap-4">
                        <Link href={`/store/${slug}`} className="flex items-center gap-3 group shrink-0">
                            {sf.logoUrl
                                ? <img src={sf.logoUrl} alt={navTitle} className="w-9 h-9 rounded-xl object-cover shadow group-hover:scale-105 transition-transform" />
                                : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg group-hover:scale-105 transition-transform"
                                    style={{ backgroundColor: pCol }}>{navTitle.charAt(0).toUpperCase()}</div>
                            }
                            <span className="font-extrabold text-[15px] tracking-tight hidden sm:block" style={{ color: headingColor }}>{navTitle}</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-0.5 ml-2">
                            {navLinks.map(l => (
                                <a key={l.id} href={`#${l.id}`}
                                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all relative"
                                    style={{ color: activeSection === l.id ? pCol : tCol, backgroundColor: activeSection === l.id ? `${pCol}14` : "transparent" }}>
                                    {l.label}
                                    {activeSection === l.id && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                            style={{ backgroundColor: pCol }} />
                                    )}
                                </a>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme}
                            className="p-2 rounded-full transition-all hover:scale-105"
                            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                        <Link href="/cart"
                            className="relative p-2 rounded-full transition-all hover:scale-105"
                            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                            <ShoppingCart className="w-5 h-5" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2"
                                    style={{ backgroundColor: pCol, borderColor: navBg }}>{itemCount}</span>
                            )}
                        </Link>
                        <button onClick={() => setMobileMenu(true)} className="md:hidden p-2 rounded-full"
                            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );

    /* ─── Main Render ─────────────────────────────────────────── */
    return (
        <div className={`${fontClass} min-h-screen flex flex-col transition-colors duration-500`} style={{ backgroundColor: bCol, color: tCol }}>

            {/* Mobile Menu */}
            {mobileMenu && (
                <div className="fixed inset-0 z-[60] md:hidden" onClick={() => setMobileMenu(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <div className="absolute right-0 top-0 h-full w-72 p-8 shadow-2xl flex flex-col"
                        style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-3">
                                {sf.logoUrl
                                    ? <img src={sf.logoUrl} alt={navTitle} className="w-8 h-8 rounded-lg object-cover" />
                                    : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                                        style={{ backgroundColor: pCol }}>{navTitle.charAt(0)}</div>
                                }
                                <span className="font-black text-base" style={{ color: headingColor }}>{navTitle}</span>
                            </div>
                            <button onClick={() => setMobileMenu(false)} className="p-2 rounded-xl"
                                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <nav className="flex flex-col gap-5 font-bold text-base" style={{ color: headingColor }}>
                            {navLinks.map(l => (
                                <a key={l.id} href={`#${l.id}`} onClick={() => setMobileMenu(false)}
                                    className="flex items-center gap-3 transition-colors"
                                    style={{ color: activeSection === l.id ? pCol : headingColor }}>
                                    {activeSection === l.id && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pCol }} />}
                                    {l.label}
                                </a>
                            ))}
                        </nav>
                        <div className="mt-auto pt-8 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                            <Link href="/cart" onClick={() => setMobileMenu(false)}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-white"
                                style={{ backgroundColor: pCol }}>
                                <ShoppingCart className="w-5 h-5" /> View Cart {itemCount > 0 && `(${itemCount})`}
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Scroll to Top Button */}
            <button
                onClick={scrollToTop}
                className="fixed bottom-24 right-6 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 border"
                style={{
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    borderColor: cardBorder,
                    color: tCol,
                    opacity: showScrollTop ? 1 : 0,
                    pointerEvents: showScrollTop ? "auto" : "none",
                    transform: showScrollTop ? "translateY(0)" : "translateY(12px)"
                }}
                aria-label="Scroll to top"
            >
                <ArrowUp className="w-4 h-4" />
            </button>

            {sectionOrder.map(section => {
                if (hiddenSections.includes(section)) return null;

                /* ── HERO ─────────────────────────────────────────────── */
                if (section === "hero") {
                    const heroLayout = sf.layout?.heroLayout || "split";
                    return (
                        <div key="hero">
                            {Navbar}

                            {heroLayout === "split" && (
                                <section id="hero" className="max-w-7xl mx-auto px-6 py-20 md:py-32"
                                    style={{ animation: heroVisible ? "heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both" : "none" }}>
                                    <div className="flex flex-col md:flex-row items-center gap-10 lg:gap-16">
                                        <div className="flex-1 flex flex-col items-start">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
                                                style={{ backgroundColor: `${pCol}20`, color: pCol }}>
                                                <Sparkles className="w-3 h-3" /> Official Store
                                            </div>
                                            <h1 className="font-black tracking-tight leading-[1.05] mb-5 text-4xl md:text-5xl lg:text-6xl"
                                                style={{ color: headingColor }}>{heroTitle}</h1>
                                            <p className="text-lg opacity-80 mb-8 max-w-lg leading-relaxed" style={{ color: tCol }}>{heroSubtitle}</p>
                                            <div className="flex flex-wrap gap-4">
                                                <a href="#products"
                                                    className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold text-white shadow-xl hover:-translate-y-0.5 transition-transform"
                                                    style={{ backgroundColor: pCol, boxShadow: `0 12px 28px -8px ${pCol}60` }}>
                                                    {ctaText} <ArrowRight className="w-5 h-5" />
                                                </a>
                                                {categories.length > 0 && (
                                                    <a href="#categories"
                                                        className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold hover:-translate-y-0.5 transition-transform"
                                                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: headingColor }}>
                                                        {ctaSecondaryText}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 w-full order-first md:order-last mb-8 md:mb-0"
                                            style={{ animation: heroVisible ? "heroFadeUp 0.9s 0.1s cubic-bezier(0.16,1,0.3,1) both" : "none" }}>
                                            {sf.coverUrl ? (
                                                <img src={sf.coverUrl} className="w-full aspect-[4/3] object-cover rounded-3xl shadow-2xl" alt="Banner" />
                                            ) : (
                                                <div className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed flex items-center justify-center"
                                                    style={{ borderColor: cardBorder, backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                                                    <Store className="w-16 h-16 opacity-15 text-slate-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {heroLayout === "centered" && (
                                <section id="hero" className="flex flex-col items-center text-center max-w-4xl mx-auto px-6 py-24 md:py-32"
                                    style={{ animation: heroVisible ? "heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both" : "none" }}>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                                        style={{ backgroundColor: `${pCol}20`, color: pCol }}>
                                        <Sparkles className="w-3 h-3" /> Official Store
                                    </div>
                                    <h1 className="font-black tracking-tight leading-[1.05] mb-6 text-4xl md:text-5xl lg:text-6xl"
                                        style={{ color: headingColor, animation: heroVisible ? "heroFadeUp 0.85s 0.1s cubic-bezier(0.16,1,0.3,1) both" : "none" }}>
                                        {heroTitle}
                                    </h1>
                                    <p className="text-lg md:text-xl opacity-80 mb-10 max-w-2xl mx-auto leading-relaxed"
                                        style={{ color: tCol, animation: heroVisible ? "heroFadeUp 0.85s 0.2s cubic-bezier(0.16,1,0.3,1) both" : "none" }}>
                                        {heroSubtitle}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto"
                                        style={{ animation: heroVisible ? "heroFadeUp 0.85s 0.3s cubic-bezier(0.16,1,0.3,1) both" : "none" }}>
                                        <a href="#products"
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 font-bold text-white shadow-xl hover:-translate-y-0.5 transition-transform text-lg"
                                            style={{ backgroundColor: pCol, boxShadow: `0 12px 28px -8px ${pCol}60` }}>
                                            {ctaText} <ArrowRight className="w-5 h-5" />
                                        </a>
                                        {categories.length > 0 && (
                                            <a href="#categories"
                                                className="inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 font-bold hover:-translate-y-0.5 transition-transform text-lg"
                                                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: headingColor }}>
                                                {ctaSecondaryText}
                                            </a>
                                        )}
                                    </div>
                                </section>
                            )}

                            {heroLayout === "full" && (
                                <section id="hero" className="relative min-h-screen flex flex-col justify-center overflow-hidden" style={{ color: "#fff" }}>
                                    {sf.coverUrl
                                        ? <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${sf.coverUrl})` }} />
                                        : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${pCol}ee 0%, ${pCol}99 35%, #0f172a 100%)` }} />
                                    }
                                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.6) 100%)" }} />
                                    <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center"
                                        style={{ animation: heroVisible ? "heroFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both" : "none" }}>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8"
                                            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>
                                            <Sparkles className="w-3.5 h-3.5" /> Official Store
                                        </div>
                                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6 drop-shadow-2xl"
                                            style={{ color: "#fff", animation: heroVisible ? "heroFadeUp 0.9s 0.1s cubic-bezier(0.16,1,0.3,1) both" : "none" }}>
                                            {heroTitle}
                                        </h1>
                                        <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow"
                                            style={{ color: "rgba(255,255,255,0.82)", animation: heroVisible ? "heroFadeUp 0.9s 0.2s cubic-bezier(0.16,1,0.3,1) both" : "none" }}>
                                            {heroSubtitle}
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center"
                                            style={{ animation: heroVisible ? "heroFadeUp 0.9s 0.3s cubic-bezier(0.16,1,0.3,1) both" : "none" }}>
                                            <a href="#products"
                                                className="px-8 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
                                                style={{ backgroundColor: pCol, color: "#fff", boxShadow: `0 20px 40px -10px ${pCol}80` }}>
                                                {ctaText} <ArrowRight className="w-5 h-5" />
                                            </a>
                                            {categories.length > 0 && (
                                                <a href="#categories"
                                                    className="px-8 py-4 rounded-2xl font-black text-base flex items-center justify-center transition-all hover:-translate-y-1"
                                                    style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", backdropFilter: "blur(8px)" }}>
                                                    {ctaSecondaryText}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                                        <ChevronDown className="w-8 h-8 text-white/50" />
                                    </div>
                                </section>
                            )}
                        </div>
                    );
                }

                /* ── CATEGORIES ───────────────────────────────────────── */
                if (section === "categories" && categories.length > 0) return (
                    <FadeSection key="categories"
                        style={{ backgroundColor: sectionAltBg, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                        <section id="categories" className="py-20 md:py-28">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="text-center mb-14">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                                        style={{ backgroundColor: `${pCol}18`, color: pCol }}>
                                        <Sparkles className="w-3.5 h-3.5" /> Collections
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3" style={{ color: headingColor }}>Shop by Category</h2>
                                    <p className="text-base font-medium max-w-xl mx-auto" style={{ color: tCol }}>Find exactly what you&apos;re looking for.</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {categories.map(cat => {
                                        const count = products.filter(p => p.categoryId === cat._id).length;
                                        return (
                                            <button key={cat._id}
                                                onClick={() => { setSelectedCategoryId(cat._id); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}
                                                className="group relative flex flex-col items-center justify-center p-8 rounded-[2rem] border overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                                                style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ background: `linear-gradient(135deg, ${pCol}14, ${pCol}05)` }} />
                                                <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10">{cat.emoji}</span>
                                                <span className="font-black text-lg relative z-10" style={{ color: headingColor }}>{cat.name}</span>
                                                <span className="text-xs font-semibold mt-1 relative z-10" style={{ color: tCol }}>{count} item{count !== 1 ? "s" : ""}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    </FadeSection>
                );

                /* ── PRODUCTS ─────────────────────────────────────────── */
                if (section === "products") return (
                    <section key="products" id="products" className="py-20 md:py-28"
                        style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                                <div>
                                    {selectedCategoryId && (
                                        <button onClick={() => setSelectedCategoryId(null)}
                                            className="flex items-center gap-2 text-sm font-semibold mb-4 transition-opacity hover:opacity-70"
                                            style={{ color: tCol }}>
                                            <ArrowLeft className="w-4 h-4" /> Back to All
                                        </button>
                                    )}
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2" style={{ color: headingColor }}>
                                        {selectedCategoryId ? categories.find(c => c._id === selectedCategoryId)?.name || "Products" : "Featured Products"}
                                    </h2>
                                    <p className="font-medium" style={{ color: tCol }}>{filtered.length} items available</p>
                                </div>
                                <div className="relative w-full md:w-72">
                                    <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)}
                                        className="w-full rounded-2xl pl-12 pr-4 py-3.5 font-medium focus:outline-none transition-all"
                                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: headingColor, border: `1px solid ${cardBorder}` }} />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: tCol, opacity: 0.5 }} />
                                </div>
                            </div>

                            {/* Category Filter Pills */}
                            {categories.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-8" style={{ scrollbarWidth: "none" }}>
                                    <button
                                        onClick={() => setSelectedCategoryId(null)}
                                        className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all"
                                        style={!selectedCategoryId
                                            ? { backgroundColor: pCol, color: "#fff" }
                                            : { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                                        All
                                    </button>
                                    {categories.map(cat => (
                                        <button key={cat._id}
                                            onClick={() => setSelectedCategoryId(cat._id)}
                                            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5"
                                            style={selectedCategoryId === cat._id
                                                ? { backgroundColor: pCol, color: "#fff" }
                                                : { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol, border: `1px solid ${cardBorder}` }}>
                                            <span>{cat.emoji}</span>
                                            <span>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {filtered.length === 0 ? (
                                <div className="text-center py-28 rounded-3xl" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                                    <ShoppingCart className="w-16 h-16 mx-auto mb-4" style={{ color: tCol, opacity: 0.2 }} />
                                    <p className="font-bold text-lg mb-2" style={{ color: headingColor }}>No products found</p>
                                    <p className="text-sm" style={{ color: tCol, opacity: 0.5 }}>Try a different search or category.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                                    {filtered.map((product, idx) => {
                                        const img = getImage(product);
                                        const effectivePrice = getEffectivePrice(product);
                                        const justAdded = addedId === product._id;
                                        const hasDisc = !!(product.discount?.value);
                                        return (
                                            <div key={product._id}
                                                className="group flex flex-col rounded-[1.75rem] overflow-hidden border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                                                style={{
                                                    backgroundColor: cardBg,
                                                    borderColor: cardBorder,
                                                    animation: `heroFadeUp 0.5s ${(idx % 8) * 0.06}s cubic-bezier(0.16,1,0.3,1) both`,
                                                    boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)"
                                                }}>
                                                <div className="aspect-[4/5] overflow-hidden relative"
                                                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}>
                                                    <Link href={`/p/${product._id}?store=${slug}`} className="block w-full h-full">
                                                        {img
                                                            ? <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                            : <div className="w-full h-full flex items-center justify-center"><Store className="w-12 h-12" style={{ color: tCol, opacity: 0.15 }} /></div>
                                                        }
                                                    </Link>
                                                    {hasDisc && (
                                                        <div className="absolute top-3 left-3 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg"
                                                            style={{ backgroundColor: pCol }}>
                                                            {product.discount!.type === "percentage" ? `${product.discount!.value}% OFF` : "Sale"}
                                                        </div>
                                                    )}
                                                    {!product.inStock && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <span className="bg-white/90 text-gray-800 text-xs font-black px-4 py-1.5 rounded-full">Out of Stock</span>
                                                        </div>
                                                    )}
                                                    {/* Quick view overlay */}
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                        <Link href={`/p/${product._id}?store=${slug}`}
                                                            className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                                                            style={{ color: "#0f172a" }}>
                                                            <Eye className="w-5 h-5" />
                                                        </Link>
                                                    </div>
                                                </div>
                                                <div className="p-4 flex flex-col flex-1">
                                                    <Link href={`/p/${product._id}?store=${slug}`}>
                                                        <h3 className="font-bold text-sm line-clamp-2 mb-1.5 hover:opacity-70 transition-opacity"
                                                            style={{ color: headingColor }}>{product.name}</h3>
                                                    </Link>
                                                    {product.description && (
                                                        <p className="text-xs line-clamp-1 mb-2" style={{ color: tCol, opacity: 0.7 }}>{product.description}</p>
                                                    )}
                                                    <div className="mt-auto mb-3.5 flex items-center gap-2">
                                                        <span className="font-black text-base" style={{ color: pCol }}>{currency} {effectivePrice.toLocaleString()}</span>
                                                        {hasDisc && <span className="text-xs line-through" style={{ color: tCol, opacity: 0.4 }}>{currency} {product.price.toLocaleString()}</span>}
                                                    </div>
                                                    <button
                                                        onClick={() => product.inStock && handleQuickAdd(product)}
                                                        disabled={!product.inStock}
                                                        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
                                                        style={!product.inStock
                                                            ? { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: tCol, opacity: 0.5 }
                                                            : justAdded
                                                                ? { backgroundColor: pCol, color: "#fff" }
                                                                : { backgroundColor: `${pCol}18`, color: pCol }
                                                        }>
                                                        {justAdded ? <><CheckCircle className="w-4 h-4" /> Added!</> : <><ShoppingCart className="w-3.5 h-3.5" /> Add to Cart</>}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                );

                /* ── FEATURES ─────────────────────────────────────────── */
                if (section === "features") {
                    const isGrid3 = sf.layout?.featuresLayout !== "grid-4";
                    const fStyle = sf.layout?.featuresStyle || "cards";
                    return (
                        <FadeSection key="features"
                            style={{ backgroundColor: fStyle === "accent" ? `${pCol}10` : sectionAltBg, borderTop: `1px solid ${cardBorder}` }}>
                            <section id="features" className="py-20 md:py-28">
                                <div className="max-w-7xl mx-auto px-6">
                                    <div className="text-center mb-14">
                                        <h2 className="font-black tracking-tight mb-4 text-4xl md:text-5xl" style={{ color: headingColor }}>Why Choose Us</h2>
                                        <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: tCol, opacity: 0.8 }}>
                                            We are committed to providing the best service to our customers.
                                        </p>
                                    </div>
                                    <div className={`grid gap-6 ${isGrid3 ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
                                        {features.map((f, i) => {
                                            const IconComp = FEATURE_ICONS[f.icon] || Store;
                                            const cardClass = fStyle === "minimal"
                                                ? "p-6 rounded-3xl text-center group"
                                                : "p-8 rounded-3xl text-center border hover:-translate-y-1 transition-transform";
                                            const cardStyle = fStyle === "minimal" ? {} : {
                                                backgroundColor: fStyle === "accent" ? (isDark ? "rgba(0,0,0,0.2)" : "#ffffff") : cardBg,
                                                borderColor: fStyle === "accent" ? "transparent" : cardBorder,
                                                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.06)"
                                            };
                                            return (
                                                <div key={i} className={cardClass} style={cardStyle}>
                                                    <div className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center ${fStyle === "minimal" ? "group-hover:scale-110 transition-transform bg-transparent" : ""}`}
                                                        style={fStyle === "minimal" ? { color: pCol } : { backgroundColor: `${pCol}18`, color: pCol }}>
                                                        <IconComp className={fStyle === "minimal" ? "w-10 h-10" : "w-7 h-7"} />
                                                    </div>
                                                    <h3 className="text-lg font-black mb-2" style={{ color: headingColor }}>{f.title}</h3>
                                                    <p className="text-sm leading-relaxed" style={{ color: tCol, opacity: 0.8 }}>{f.description}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        </FadeSection>
                    );
                }

                /* ── TRUST BAR ────────────────────────────────────────── */
                if (section === "trust") return (
                    <section key="trust" id="trust" className="py-10"
                        style={{ backgroundColor: `${pCol}0d`, borderTop: `1px solid ${pCol}28`, borderBottom: `1px solid ${pCol}28` }}>
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                                {trustBadges.map((badge, i) => {
                                    const IconComp = TRUST_ICONS[badge.icon] || ShieldCheck;
                                    return (
                                        <div key={i} className="flex items-center gap-3 p-2">
                                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${pCol}20`, color: pCol }}>
                                                <IconComp className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm" style={{ color: headingColor }}>{badge.label}</p>
                                                <p className="text-xs font-medium" style={{ color: tCol }}>{badge.sub}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                );

                /* ── ABOUT ────────────────────────────────────────────── */
                if (section === "about") return (
                    <FadeSection key="about"
                        style={{ backgroundColor: sectionAltBg, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                        <section id="about" className="py-20 md:py-32">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="grid md:grid-cols-2 gap-14 items-center">
                                    <div className="relative">
                                        <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl"
                                            style={{ background: `linear-gradient(135deg, ${pCol}30, ${pCol}10)`, border: `1px solid ${cardBorder}` }}>
                                            {sf.coverUrl
                                                ? <img src={sf.coverUrl} alt="About" className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4"
                                                            style={{ backgroundColor: `${pCol}25`, color: pCol }}>
                                                            {sf.logoUrl
                                                                ? <img src={sf.logoUrl} alt="" className="w-16 h-16 object-contain rounded-2xl" />
                                                                : <Store className="w-12 h-12" />
                                                            }
                                                        </div>
                                                        <p className="font-black text-xl" style={{ color: headingColor }}>{navTitle}</p>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                        {/* Stats card */}
                                        <div className="absolute -bottom-6 -right-4 md:-right-6 p-5 rounded-2xl shadow-2xl border"
                                            style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: cardBorder }}>
                                            <div className="flex gap-5">
                                                {aboutStats.map((s, i) => (
                                                    <div key={i} className="text-center">
                                                        <div className="text-xl font-black" style={{ color: pCol }}>{s.value}</div>
                                                        <div className="text-[10px] font-semibold" style={{ color: tCol }}>{s.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6"
                                            style={{ backgroundColor: `${pCol}18`, color: pCol }}>
                                            <Sparkles className="w-3.5 h-3.5" /> About Us
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6" style={{ color: headingColor }}>{aboutTitle}</h2>
                                        <p className="text-base font-medium leading-relaxed mb-8" style={{ color: tCol }}>{aboutBody}</p>
                                        <a href="#products"
                                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-white transition-all hover:-translate-y-0.5"
                                            style={{ backgroundColor: pCol, boxShadow: `0 10px 30px -8px ${pCol}70` }}>
                                            Shop Now <ArrowRight className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </FadeSection>
                );

                /* ── TESTIMONIALS ─────────────────────────────────────── */
                if (section === "testimonials") return (
                    <FadeSection key="testimonials"
                        style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                        <section id="testimonials" className="py-20 md:py-28 overflow-hidden">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="text-center mb-14">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                                        style={{ backgroundColor: `${pCol}18`, color: pCol }}>
                                        <Star className="w-3.5 h-3.5" fill={pCol} /> Reviews
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3" style={{ color: headingColor }}>What Customers Say</h2>
                                    <p className="text-base font-medium" style={{ color: tCol }}>Real experiences from real customers</p>
                                </div>

                                {/* Horizontal scroll cards */}
                                <div ref={testimonialRef}
                                    className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory"
                                    style={{ scrollbarWidth: "none" }}>
                                    {testimonials.map((t, i) => (
                                        <div key={i}
                                            className="flex-shrink-0 w-72 md:w-80 snap-start rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col"
                                            style={{
                                                backgroundColor: cardBg, borderColor: cardBorder,
                                                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.06)"
                                            }}>
                                            <Quote className="w-8 h-8 mb-4 flex-shrink-0" style={{ color: `${pCol}55` }} />
                                            <p className="text-sm font-medium leading-relaxed mb-5 flex-1" style={{ color: tCol }}>&quot;{t.text}&quot;</p>
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                                                        style={{ backgroundColor: pCol }}>
                                                        {t.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm" style={{ color: headingColor }}>{t.name}</p>
                                                        <Stars n={t.rating} />
                                                    </div>
                                                </div>
                                                <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: pCol, opacity: 0.6 }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Dot indicators */}
                                {testimonials.length > 1 && (
                                    <div className="flex justify-center gap-2 mt-5">
                                        {testimonials.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    if (!testimonialRef.current) return;
                                                    const cardW = testimonialRef.current.scrollWidth / testimonials.length;
                                                    testimonialRef.current.scrollTo({ left: i * cardW, behavior: "smooth" });
                                                }}
                                                className="rounded-full transition-all duration-300"
                                                style={{
                                                    width: activeDot === i ? "20px" : "8px",
                                                    height: "8px",
                                                    backgroundColor: activeDot === i ? pCol : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)")
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </FadeSection>
                );

                /* ── FAQ ──────────────────────────────────────────────── */
                if (section === "faq") {
                    const fStyle = sf.layout?.faqStyle || "cards";
                    const isFaqMinimal = fStyle === "minimal";
                    return (
                        <FadeSection key="faq"
                            style={{ backgroundColor: fStyle === "accent" ? `${pCol}0a` : sectionAltBg, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                            <section id="faq" className="py-20 md:py-28">
                                <div className="max-w-3xl mx-auto px-6">
                                    <div className="text-center mb-14">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                                            style={{ backgroundColor: `${pCol}18`, color: pCol }}>
                                            <CheckCircle className="w-3.5 h-3.5" /> Support
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3" style={{ color: headingColor }}>Frequent Questions</h2>
                                        <p className="font-medium" style={{ color: tCol }}>Everything you need to know.</p>
                                    </div>
                                    <div className={isFaqMinimal ? "space-y-6" : "space-y-3"}>
                                        {faqs.map((faq, i) => {
                                            const isOpen = openFaq === i;
                                            const cardClass = isFaqMinimal ? "pb-6 border-b" : "rounded-2xl border overflow-hidden transition-all";
                                            const cardStyle = isFaqMinimal ? { borderColor: cardBorder } : {
                                                backgroundColor: fStyle === "accent" ? (isDark ? "rgba(0,0,0,0.2)" : "#ffffff") : cardBg,
                                                borderColor: isOpen ? pCol : (fStyle === "accent" ? "transparent" : cardBorder)
                                            };
                                            return (
                                                <div key={i} className={cardClass} style={cardStyle}>
                                                    <button onClick={() => setOpenFaq(isOpen ? null : i)}
                                                        className={`w-full text-left flex justify-between items-center focus:outline-none ${isFaqMinimal ? "" : "px-6 py-5"}`}>
                                                        <span className="font-black text-base pr-4" style={{ color: headingColor }}>{faq.question}</span>
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                                                            style={{
                                                                backgroundColor: isOpen ? `${pCol}20` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                                                color: pCol,
                                                                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
                                                            }}>
                                                            <ChevronDown className="w-4 h-4" />
                                                        </div>
                                                    </button>
                                                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96" : "max-h-0"}`}>
                                                        <div className={`${isFaqMinimal ? "pt-2" : "px-6 pb-5"} font-medium leading-relaxed text-sm`} style={{ color: tCol }}>
                                                            {faq.answer}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        </FadeSection>
                    );
                }

                /* ── FOOTER ───────────────────────────────────────────── */
                if (section === "footer") {
                    const footerBgMap: Record<string, string> = { navy: "#0f172a", slate: "#1e293b", dark: "#020617" };
                    const footerBg = footerBgMap[sf.footerStyle || "dark"] || "#020617";
                    return (
                        <footer key="footer" id="footer" className="pt-16 pb-10 mt-auto" style={{ backgroundColor: footerBg }}>
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                                    <div>
                                        <div className="flex items-center gap-3 mb-5">
                                            {sf.logoUrl
                                                ? <img src={sf.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
                                                : <div className="w-10 h-10 rounded-xl font-black flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: pCol }}>{navTitle.charAt(0)}</div>
                                            }
                                            <span className="font-black text-xl text-white">{sf.storeName || business.name}</span>
                                        </div>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                            {sf.footerDescription || business.description || "Discover premium products crafted with quality in mind."}
                                        </p>
                                        <div className="flex gap-3">
                                            {sf.socialLinks?.instagram && (
                                                <a href={sf.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                                                    className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all"
                                                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                                                    <Instagram className="w-4 h-4 text-slate-400" />
                                                </a>
                                            )}
                                            {sf.socialLinks?.facebook && (
                                                <a href={sf.socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                                                    className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all"
                                                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                                                    <Facebook className="w-4 h-4 text-slate-400" />
                                                </a>
                                            )}
                                            {sf.socialLinks?.twitter && (
                                                <a href={sf.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                                                    className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all"
                                                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                                                    <Twitter className="w-4 h-4 text-slate-400" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-base mb-6 tracking-tight">Quick Links</h3>
                                        <ul className="space-y-3 text-slate-400 text-sm font-medium">
                                            {navLinks.map(l => (
                                                <li key={l.id}><a href={`#${l.id}`} className="hover:text-white transition-colors">{l.label}</a></li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-base mb-6 tracking-tight">Contact Us</h3>
                                        <ul className="space-y-4 text-slate-400 text-sm font-medium">
                                            {(sf.contactPhone || sf.contactInfo || business.contactPhone) && (
                                                <li className="flex items-start gap-3">
                                                    <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: pCol }} />
                                                    <span>{sf.contactPhone || sf.contactInfo || business.contactPhone}</span>
                                                </li>
                                            )}
                                            <li className="flex items-start gap-3">
                                                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: pCol }} />
                                                <span>{sf.contactEmail || `info@${slug}.com`}</span>
                                            </li>
                                            {business.address && (
                                                <li className="flex items-start gap-3">
                                                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: pCol }} />
                                                    <span>{business.address}</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                                <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
                                    style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                                    <p className="text-slate-500 text-sm font-medium">{footerText}</p>
                                    <div className="flex items-center gap-4">
                                        <button onClick={scrollToTop}
                                            className="text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1.5 text-xs font-semibold">
                                            <ArrowUp className="w-3 h-3" /> Back to top
                                        </button>
                                        <p className="text-slate-600 text-xs font-black tracking-widest uppercase">Powered by Sellix</p>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    );
                }

                return null;
            })}

            {/* WhatsApp Floating Button with tooltip */}
            {(business?.contactPhone || sf.contactPhone) && (
                <div className="fixed bottom-6 right-6 z-50 group flex items-center gap-3">
                    {/* Tooltip */}
                    <div className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg
                          opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0
                          transition-all duration-200 pointer-events-none whitespace-nowrap"
                        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>
                        Chat with us 👋
                    </div>
                    <a
                        href={`https://wa.me/${(business?.contactPhone || sf.contactPhone)?.replace(/[^0-9]/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-white/20 relative overflow-hidden"
                        style={{ backgroundColor: "#25D366" }}
                        aria-label="Chat on WhatsApp">
                        <MessageCircle className="w-7 h-7 text-white relative z-10" />
                        {/* Ping ring */}
                        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
                    </a>
                </div>
            )}

            <style jsx global>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 0px; }
        html { scroll-behavior: smooth; }
      `}</style>
        </div>
    );
}