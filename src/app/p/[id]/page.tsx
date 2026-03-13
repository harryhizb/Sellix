"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShoppingCart, Store, ArrowLeft, ChevronLeft, ChevronRight, Check,
    Minus, Plus, ShieldCheck, Truck, RotateCcw,
    Phone, Mail, Moon, Sun, Facebook, Instagram, Twitter,
    ArrowRight, Sparkles, Heart
} from "lucide-react";
import { useCart } from "@/stores/cartStore";

interface Storefront {
    logoUrl?: string;
    coverUrl?: string;
    storeName?: string;
    navbarTitle?: string;
    footerText?: string;
    contactInfo?: string;
    theme?: {
        primaryColor?: string;
        textColor?: string;
        bgColor?: string;
        fontFamily?: string;
        darkMode?: boolean;
    };
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    contactEmail?: string;
    contactPhone?: string;
}

interface Product {
    _id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    imageUrl?: string;
    images?: { publicId: string; secureUrl: string }[];
    inStock: boolean;
    stockQuantity: number;
    discount?: { type: string; value: number };
    variants?: { name: string; price?: number; stock?: number; attributes?: any }[];
    category?: string;
}

interface Business {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    address?: string;
    contactPhone?: string;
    settings?: { currency?: string };
    storefront?: Storefront;
    policies?: {
        delivery?: { enabled: boolean; timeframe?: string };
        refund?: { enabled: boolean; durationDays?: number };
    };
}

export default function ProductPage() {
    const { id } = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const slug = searchParams.get("store") || "";

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
    const [quantity, setQuantity] = useState(1);
    const [imgIdx, setImgIdx] = useState(0);
    const [added, setAdded] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);
    const [theme, setTheme] = useState("light");

    const { addItem, getItemCount } = useCart();
    const itemCount = getItemCount();

    useEffect(() => {
        if (!slug) return;
        const saved = localStorage.getItem(`store_theme_${slug}`);
        if (saved) setTheme(saved);
        else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");

        fetch(`/api/store/${slug}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) { setError(data.error); return; }
                const prods: Product[] = data.products || [];
                const currentProduct = prods.find(p => p._id === id);
                if (!currentProduct) { setError("Product not found"); return; }
                setProduct(currentProduct);
                setBusiness(data.business);
                setRelatedProducts(prods.filter(p => p._id !== id).sort(() => 0.5 - Math.random()).slice(0, 4));
            })
            .catch(() => setError("Failed to load product."))
            .finally(() => setLoading(false));
    }, [id, slug]);

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        localStorage.setItem(`store_theme_${slug}`, next);
    };

    const images: string[] = [
        ...(product?.images?.map(i => i.secureUrl) || []),
        ...(product?.imageUrl && !product.images?.length ? [product.imageUrl] : []),
    ];

    const getImage = (p: Product) => p.images?.[0]?.secureUrl || p.imageUrl || "";

    // MODIFIED: price is always base price (variant price ignored)
    const getEffectivePrice = (p: Product, variantName?: string) => {
        if (!p) return 0;
        const base = p.price; // ignore variant price
        if (!p.discount?.value) return base;
        return p.discount.type === "percentage"
            ? base - (base * p.discount.value) / 100
            : base - p.discount.value;
    };

    const handleAddToCart = () => {
        if (!product || !business) return;
        addItem({
            productId: product._id,
            name: product.name,
            price: getEffectivePrice(product, selectedVariant),
            quantity,
            variant: selectedVariant,
            imageUrl: images[0] || undefined,
            businessSlug: business.slug,
            businessId: business._id,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const [quickAddedId, setQuickAddedId] = useState<string | null>(null);
    const handleQuickAdd = (p: Product) => {
        if (!business) return;
        addItem({
            productId: p._id,
            name: p.name,
            price: getEffectivePrice(p),
            quantity: 1,
            imageUrl: p.images?.[0]?.secureUrl || p.imageUrl || undefined,
            businessSlug: business.slug,
            businessId: business._id,
        });
        setQuickAddedId(p._id);
        setTimeout(() => setQuickAddedId(null), 1500);
    };

    const currency = business?.settings?.currency || "PKR";
    const sf = business?.storefront || {};
    const navTitle = sf.navbarTitle || sf.storeName || business?.name || "Store";
    const footerText = sf.footerText || `© ${new Date().getFullYear()} ${business?.name}. All rights reserved.`;

    // Theme variables
    const isDark = theme === "dark";
    const pCol = sf.theme?.primaryColor || "#10b981";
    const headingColor = isDark ? "#ffffff" : "#0f172a";
    const tCol = isDark ? "#94a3b8" : "#475569";
    const bCol = isDark ? "#0f172a" : "#ffffff";
    const fontClass = sf.theme?.fontFamily || "font-sans";
    const cardBg = isDark ? "#131e31" : "#f8fafc";
    const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const navBg = isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.92)";

    // Loading / Error states
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bCol }}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${pCol}40`, borderTopColor: pCol }} />
                <p className="text-sm font-medium animate-pulse" style={{ color: tCol }}>Loading product…</p>
            </div>
        </div>
    );

    if (error || !product) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bCol }}>
            <div className="text-center p-10 rounded-3xl shadow-2xl w-full max-w-md border" style={{ backgroundColor: cardBg, borderColor }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${pCol}15` }}>
                    <Store className="w-8 h-8" style={{ color: pCol }} />
                </div>
                <h1 className="text-2xl font-black mb-2" style={{ color: headingColor }}>Product Not Found</h1>
                <p className="mb-6" style={{ color: tCol }}>{error || "This product could not be found."}</p>
                {slug && (
                    <Link href={`/store/${slug}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black transition-all shadow-lg text-white"
                        style={{ backgroundColor: pCol }}>
                        <ArrowLeft className="w-4 h-4" /> Back to Store
                    </Link>
                )}
            </div>
        </div>
    );

    const effectivePrice = getEffectivePrice(product, selectedVariant);
    const hasDiscount = product.discount?.value && product.discount.value > 0;

    return (
        <div className={`${fontClass} min-h-screen flex flex-col transition-colors duration-300`} style={{ backgroundColor: bCol, color: tCol }}>

            {/* NAVBAR */}
            <header className="sticky top-0 z-50 backdrop-blur-xl border-b shadow-sm transition-all"
                style={{ backgroundColor: navBg, borderColor }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <Link href={`/store/${slug}`} className="flex items-center gap-3 group">
                            {sf.logoUrl ? (
                                <img src={sf.logoUrl} alt={navTitle} className="w-10 h-10 rounded-xl object-cover shadow group-hover:scale-105 transition-transform" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-105 transition-transform"
                                    style={{ backgroundColor: pCol }}>
                                    {navTitle.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="font-extrabold text-lg hidden sm:block" style={{ color: headingColor }}>{navTitle}</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <button onClick={toggleTheme}
                                className="p-2.5 rounded-full transition-all hover:scale-105"
                                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                            </button>
                            <Link href="/cart"
                                className="relative p-2.5 rounded-full transition-all hover:scale-105"
                                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                                <ShoppingCart className="w-5 h-5" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2"
                                        style={{ backgroundColor: pCol, borderColor: navBg }}>
                                        {itemCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Breadcrumb */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link href={`/store/${slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-100"
                        style={{ color: tCol, opacity: 0.7 }}
                        onMouseEnter={e => (e.currentTarget.style.color = pCol)}
                        onMouseLeave={e => (e.currentTarget.style.color = tCol)}>
                        <ArrowLeft className="w-4 h-4" /> Back to Store
                    </Link>
                </div>

                {/* Product Detail */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    <div className="rounded-[2.5rem] p-6 lg:p-12 shadow-2xl border" style={{ backgroundColor: cardBg, borderColor }}>
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">

                            {/* LEFT: Gallery */}
                            <div className="flex flex-col gap-4 select-none">
                                <div className="aspect-square rounded-3xl overflow-hidden relative border group"
                                    style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor }}>
                                    {images.length > 0 ? (
                                        <img src={images[imgIdx]} alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Store className="w-20 h-20" style={{ color: tCol, opacity: 0.15 }} />
                                        </div>
                                    )}
                                    {images.length > 1 && (
                                        <>
                                            <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg opacity-0 group-hover:opacity-100"
                                                style={{ backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.9)", color: headingColor }}>
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg opacity-0 group-hover:opacity-100"
                                                style={{ backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.9)", color: headingColor }}>
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                    {hasDiscount && (
                                        <div className="absolute top-5 left-5 bg-red-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                            Sale
                                        </div>
                                    )}
                                </div>
                                {images.length > 1 && (
                                    <div className="flex gap-3 overflow-x-auto pb-1">
                                        {images.map((img, i) => (
                                            <button key={i} onClick={() => setImgIdx(i)}
                                                className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all"
                                                style={{ borderColor: i === imgIdx ? pCol : "transparent", opacity: i === imgIdx ? 1 : 0.55 }}>
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: Product Info */}
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: pCol }}>
                                    {product.category || "Product"}
                                </span>
                                <h1 className="text-3xl md:text-5xl font-black leading-tight mb-5" style={{ color: headingColor }}>
                                    {product.name}
                                </h1>

                                {/* Price */}
                                <div className="flex flex-wrap items-baseline gap-3 mb-6 pb-6 border-b" style={{ borderColor }}>
                                    <span className="text-4xl font-black" style={{ color: pCol }}>
                                        {currency} {effectivePrice.toLocaleString()}
                                    </span>
                                    {hasDiscount && (
                                        <>
                                            <span className="text-xl line-through font-medium" style={{ color: tCol, opacity: 0.5 }}>
                                                {currency} {product.price.toLocaleString()}
                                            </span>
                                            <span className="text-sm font-black px-3 py-1 rounded-xl"
                                                style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                                {product.discount!.type === "percentage"
                                                    ? `${product.discount!.value}% OFF`
                                                    : `Save ${currency} ${product.discount!.value}`}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <p className="text-base leading-relaxed mb-8 font-medium" style={{ color: tCol }}>
                                        {product.description}
                                    </p>
                                )}

                                {/* Trust Badges */}
                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    {[
                                        { icon: ShieldCheck, label: "Secure Checkout", sub: "100% Protected", color: "#10b981" },
                                        ...(business?.policies?.delivery?.enabled ? [{ icon: Truck, label: "Delivery", sub: business.policies.delivery.timeframe || "Available", color: "#3b82f6" }] : []),
                                        ...(business?.policies?.refund?.enabled ? [{ icon: RotateCcw, label: `${business.policies.refund.durationDays || 7} Days Return`, sub: "Hassle-free returns", color: "#8b5cf6", colSpan: true }] : []),
                                    ].map((badge, i) => (
                                        <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${(badge as any).colSpan ? "col-span-2" : ""}`}
                                            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderColor }}>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${badge.color}18`, color: badge.color }}>
                                                <badge.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black" style={{ color: headingColor }}>{badge.label}</p>
                                                <p className="text-xs font-medium line-clamp-1" style={{ color: tCol }}>{badge.sub}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Variants - MODIFIED: no price shown */}
                                {product.variants && product.variants.length > 0 && (
                                    <div className="mb-6">
                                        <span className="text-sm font-black mb-3 block" style={{ color: headingColor }}>Select Option</span>
                                        <div className="flex flex-wrap gap-2">
                                            {product.variants.map((v) => (
                                                <button key={v.name}
                                                    onClick={() => setSelectedVariant(v.name === selectedVariant ? undefined : v.name)}
                                                    className="px-5 py-3 rounded-xl text-sm font-bold transition-all border-2"
                                                    style={selectedVariant === v.name
                                                        ? { borderColor: pCol, backgroundColor: `${pCol}12`, color: pCol }
                                                        : { borderColor, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff", color: tCol }}>
                                                    {v.name} {/* removed price display */}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Stock + CTA */}
                                <div className="mt-auto pt-6 border-t" style={{ borderColor }}>
                                    <div className="flex items-center gap-2 mb-5">
                                        <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: product.inStock ? "#10b981" : "#ef4444" }} />
                                        <span className="text-sm font-bold" style={{ color: product.inStock ? "#10b981" : "#ef4444" }}>
                                            {product.inStock ? "In Stock" : "Out of Stock"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {/* Qty */}
                                        <div className="flex items-center justify-between rounded-2xl p-1 border sm:w-36"
                                            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", borderColor }}>
                                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                                                style={{ color: tCol }}>
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center font-black text-lg" style={{ color: headingColor }}>{quantity}</span>
                                            <button onClick={() => setQuantity(q => q + 1)}
                                                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                                                style={{ color: tCol }}>
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {/* Add to Cart */}
                                        <button onClick={handleAddToCart} disabled={!product.inStock}
                                            className="flex-1 h-14 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={!product.inStock
                                                ? { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", color: tCol }
                                                : added
                                                    ? { backgroundColor: "#10b981", color: "#fff" }
                                                    : { backgroundColor: pCol, color: "#fff", boxShadow: `0 20px 40px -10px ${pCol}40` }}>
                                            {added ? <><Check className="w-6 h-6" /> Added!</> : <><ShoppingCart className="w-6 h-6" /> Add to Cart</>}
                                        </button>
                                        {/* Wishlist */}
                                        <button onClick={() => setWishlisted(w => !w)}
                                            className="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all"
                                            style={{ borderColor: wishlisted ? "#ef4444" : borderColor, backgroundColor: wishlisted ? "rgba(239,68,68,0.1)" : "transparent", color: wishlisted ? "#ef4444" : tCol }}>
                                            <Heart className={`w-5 h-5 ${wishlisted ? "fill-current" : ""}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RELATED PRODUCTS */}
                {relatedProducts.length > 0 && (
                    <section className="py-20 border-t" style={{ backgroundColor: isDark ? "#0a1628" : "#f8fafc", borderColor }}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-end justify-between mb-12">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-black mb-2" style={{ color: headingColor }}>
                                        You May Also Like
                                    </h2>
                                    <p className="font-medium" style={{ color: tCol }}>
                                        More from {sf.storeName || business?.name}
                                    </p>
                                </div>
                                <Link href={`/store/${slug}`}
                                    className="hidden sm:inline-flex items-center gap-2 font-bold text-sm hover:underline"
                                    style={{ color: pCol }}>
                                    View All <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                                {relatedProducts.map((relProduct) => {
                                    const img = getImage(relProduct);
                                    const effectivePrc = getEffectivePrice(relProduct);
                                    const hasDisc = relProduct.discount?.value && relProduct.discount.value > 0;
                                    const justAdded = quickAddedId === relProduct._id;
                                    return (
                                        <div key={relProduct._id} className="group flex flex-col rounded-3xl overflow-hidden border hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                                            style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor }}>
                                            <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc" }}>
                                                <Link href={`/p/${relProduct._id}?store=${slug}`} className="block w-full h-full">
                                                    {img ? (
                                                        <img src={img} alt={relProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Store className="w-12 h-12" style={{ color: tCol, opacity: 0.15 }} />
                                                        </div>
                                                    )}
                                                </Link>
                                                {hasDisc && (
                                                    <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                                        Sale
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-5 flex flex-col flex-1">
                                                <Link href={`/p/${relProduct._id}?store=${slug}`}>
                                                    <h3 className="font-black text-base leading-tight mb-3 line-clamp-2 transition-colors" style={{ color: headingColor }}
                                                        onMouseEnter={e => (e.currentTarget.style.color = pCol)}
                                                        onMouseLeave={e => (e.currentTarget.style.color = headingColor)}>
                                                        {relProduct.name}
                                                    </h3>
                                                </Link>
                                                <div className="flex items-center gap-2 mb-5 mt-auto">
                                                    <span className="font-black text-xl" style={{ color: pCol }}>
                                                        {currency} {effectivePrc.toLocaleString()}
                                                    </span>
                                                    {hasDisc && (
                                                        <span className="text-sm line-through font-medium" style={{ color: tCol, opacity: 0.4 }}>
                                                            {currency} {relProduct.price.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Link href={`/p/${relProduct._id}?store=${slug}`}
                                                        className="flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all border-2"
                                                        style={{ borderColor, color: headingColor }}>
                                                        Details
                                                    </Link>
                                                    <button
                                                        onClick={() => relProduct.inStock && handleQuickAdd(relProduct)}
                                                        disabled={!relProduct.inStock}
                                                        className="flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                                                        style={justAdded
                                                            ? { backgroundColor: pCol, color: "#fff" }
                                                            : { backgroundColor: `${pCol}18`, color: pCol }}>
                                                        {justAdded ? "Added ✓" : "+ Add"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-8 text-center sm:hidden">
                                <Link href={`/store/${slug}`}
                                    className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black"
                                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", color: headingColor }}>
                                    View All Products
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* FOOTER */}
            <footer className="pt-16 pb-10 mt-auto" style={{ backgroundColor: "#020617" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                {sf.logoUrl ? (
                                    <img src={sf.logoUrl} alt={navTitle} className="w-10 h-10 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{ backgroundColor: pCol }}>
                                        {navTitle.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="font-black text-xl text-white">{sf.storeName || business?.name}</span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                {business?.description || "High quality products delivered to you."}
                            </p>
                            {(sf.socialLinks?.facebook || sf.socialLinks?.instagram || sf.socialLinks?.twitter) && (
                                <div className="flex gap-3">
                                    {sf.socialLinks?.facebook && (
                                        <a href={sf.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                                            <Facebook className="w-4 h-4 text-slate-400" />
                                        </a>
                                    )}
                                    {sf.socialLinks?.instagram && (
                                        <a href={sf.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                                            <Instagram className="w-4 h-4 text-slate-400" />
                                        </a>
                                    )}
                                    {sf.socialLinks?.twitter && (
                                        <a href={sf.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                                            <Twitter className="w-4 h-4 text-slate-400" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-white font-black text-base mb-6">Quick Links</h3>
                            <ul className="space-y-3 text-slate-400 text-sm font-medium">
                                <li><Link href={`/store/${slug}`} className="hover:text-white transition-colors">Store Home</Link></li>
                                <li><Link href="/cart" className="hover:text-white transition-colors">Your Cart</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-black text-base mb-6">Contact Us</h3>
                            <ul className="space-y-4 text-slate-400 text-sm font-medium">
                                {(sf.contactPhone || sf.contactInfo || business?.contactPhone) && (
                                    <li className="flex items-start gap-3">
                                        <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: pCol }} />
                                        <span>{sf.contactPhone || sf.contactInfo || business?.contactPhone}</span>
                                    </li>
                                )}
                                <li className="flex items-start gap-3">
                                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: pCol }} />
                                    <span>{sf.contactEmail || `info@${slug}.com`}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <p className="text-slate-500 text-sm font-medium">{footerText}</p>
                        <p className="text-slate-600 text-xs font-black tracking-widest uppercase">Powered by Sellix</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}