"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
    Trash2, Plus, Minus, ShoppingBag, ArrowRight,
    ShoppingCart, ArrowLeft, Store, ShieldCheck, Sun, Moon,
    Loader2
} from "lucide-react";
import { useCart } from "@/stores/cartStore";

export default function CartPage() {
    const { items, removeItem, updateQuantity, clearCart, getSubtotal } = useCart();
    const router = useRouter();
    const [clearing, setClearing] = useState(false);
    const [theme, setTheme] = useState("light");
    const [storeInfo, setStoreInfo] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const subtotal = getSubtotal();
    const slug = items[0]?.businessSlug || "";

    const fetchStoreInfo = useCallback(() => {
        if (!slug) {
            setLoading(false);
            return;
        }
        fetch(`/api/store/${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data.business?.storefront) {
                    setStoreInfo(data.business.storefront);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [slug]);

    useEffect(() => {
        fetchStoreInfo();
    }, [fetchStoreInfo]);

    useEffect(() => {
        const saved = slug ? localStorage.getItem(`store_theme_${slug}`) : null;
        if (saved) setTheme(saved);
        else if (storeInfo?.theme?.darkMode) setTheme('dark');
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
    }, [slug, storeInfo]);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        if (slug) localStorage.setItem(`store_theme_${slug}`, next);
    };

    const handleClear = () => {
        if (!confirm("Are you sure you want to empty your cart?")) return;
        setClearing(true);
        setTimeout(() => { clearCart(); setClearing(false); }, 300);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    const isDark = theme === "dark";
    const pCol = storeInfo?.theme?.primaryColor || "#10b981";
    const headingColor = isDark ? "#ffffff" : "#0f172a";
    const tCol = isDark ? "#94a3b8" : (storeInfo?.theme?.textColor || "#475569");
    const bCol = isDark ? "#0f172a" : (storeInfo?.theme?.bgColor || "#f8fafc");
    const cardBg = isDark ? "#131e31" : "#ffffff";
    const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const navBg = isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.92)";
    const fontClass = storeInfo?.theme?.fontFamily || "font-sans";

    if (items.length === 0) {
        return (
            <div className={`${fontClass} min-h-screen transition-colors duration-300 flex flex-col items-center justify-center p-4`}
                style={{ backgroundColor: bCol }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm border"
                    style={{ backgroundColor: `${pCol}10`, borderColor: `${pCol}20` }}>
                    <ShoppingCart className="w-10 h-10" style={{ color: pCol }} />
                </div>
                <h1 className="text-3xl font-black mb-3" style={{ color: headingColor }}>Your Cart is Empty</h1>
                <p className="mb-8 max-w-sm text-center font-medium" style={{ color: tCol }}>
                    Looks like you haven&apos;t added any items to your cart yet. Discover some amazing products in the store!
                </p>
                <button 
                    onClick={() => router.back()} 
                    className="px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 hover:-translate-y-1 hover:shadow-emerald-500/25"
                    style={{ backgroundColor: pCol, color: "#fff" }}
                >
                    <ArrowLeft className="w-5 h-5" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className={`${fontClass} min-h-screen transition-colors duration-300 flex flex-col`}
            style={{ backgroundColor: bCol }}>
            
            <header className="sticky top-0 z-50 backdrop-blur-xl border-b transition-colors"
                style={{ backgroundColor: navBg, borderColor }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black tracking-tight" style={{ color: headingColor }}>Shopping Cart</h1>
                        <p className="text-sm font-medium" style={{ color: tCol }}>{items.length} item{items.length !== 1 ? 's' : ''}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme}
                            className="p-2.5 rounded-full transition-all hover:scale-105"
                            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: tCol }}>
                            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                        {slug && (
                            <Link href={`/store/${slug}`} className="hidden sm:flex px-5 py-2.5 rounded-xl text-sm font-bold transition-all items-center gap-2"
                                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: headingColor }}>
                                <Store className="w-4 h-4" /> Store
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
                {slug && (
                    <Link href={`/store/${slug}`} className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors hover:scale-105 opacity-80"
                        style={{ color: tCol }}>
                        <ArrowLeft className="w-4 h-4" /> Continue Shopping
                    </Link>
                )}

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Items List */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black" style={{ color: headingColor }}>Cart Items</h2>
                            <button onClick={handleClear} className="text-sm font-bold transition-colors flex items-center gap-1.5 opacity-80 hover:opacity-100 text-red-500">
                                <Trash2 className="w-4 h-4" /> Clear All
                            </button>
                        </div>
                        
                        <div className={`space-y-4 md:space-y-6 transition-opacity duration-300 ${clearing ? "opacity-0" : "opacity-100"}`}>
                            {items.map((item) => (
                                <div key={`${item.productId}-${item.variant}`} className="border rounded-[2rem] p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center shadow-sm hover:shadow-md transition-shadow"
                                    style={{ backgroundColor: cardBg, borderColor }}>
                                    
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border"
                                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", borderColor }}>
                                        {item.imageUrl ? (
                                            <Image 
                                              src={item.imageUrl} 
                                              alt={item.name} 
                                              width={96} 
                                              height={96} 
                                              className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag className="w-8 h-8 opacity-30" style={{ color: tCol }} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex justify-between items-start gap-4 mb-1">
                                            <h3 className="font-bold text-base sm:text-lg line-clamp-2" style={{ color: headingColor }}>{item.name}</h3>
                                            <button 
                                                onClick={() => removeItem(item.productId, item.variant)} 
                                                className="transition-colors p-1 opacity-50 hover:opacity-100 text-red-500"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        {item.variant && <p className="text-sm font-medium mb-3 block" style={{ color: tCol }}>Variant: {item.variant}</p>}
                                        
                                        <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-2">
                                            <p className="font-black text-lg" style={{ color: pCol }}>
                                                PKR {(item.price * item.quantity).toLocaleString()}
                                            </p>
                                            
                                            <div className="flex items-center rounded-xl p-1 border"
                                                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderColor }}>
                                                <button 
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)} 
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-all"
                                                    style={{ color: tCol, backgroundColor: cardBg }}
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-bold" style={{ color: headingColor }}>{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)} 
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-all"
                                                    style={{ color: tCol, backgroundColor: cardBg }}
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-5 xl:col-span-4">
                        <div className="border rounded-[2rem] p-6 lg:p-8 shadow-xl sticky top-24"
                            style={{ backgroundColor: cardBg, borderColor }}>
                            <h2 className="text-xl font-black mb-6" style={{ color: headingColor }}>Order Summary</h2>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center text-base">
                                    <span className="font-medium" style={{ color: tCol }}>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                                    <span className="font-bold" style={{ color: headingColor }}>PKR {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-base">
                                    <span className="font-medium" style={{ color: tCol }}>Shipping</span>
                                    <span className="text-sm font-bold opacity-70" style={{ color: tCol }}>Calculated at checkout</span>
                                </div>
                                <div className="flex justify-between items-center text-base">
                                    <span className="font-medium" style={{ color: tCol }}>Taxes</span>
                                    <span className="text-sm font-bold opacity-70" style={{ color: tCol }}>Included</span>
                                </div>
                            </div>
                            
                            <div className="border-t pt-6 pb-8" style={{ borderColor }}>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="font-bold text-lg" style={{ color: headingColor }}>Total</span>
                                    <span className="text-3xl font-black tracking-tight" style={{ color: pCol }}>
                                        <span className="text-lg mr-1 opacity-70">PKR</span>
                                        {subtotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/checkout?store=${slug}`)}
                                className="w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2 mb-4"
                                style={{ backgroundColor: pCol, color: "#fff", boxShadow: `0 20px 40px -10px ${pCol}50` }}
                            >
                                Proceed to Checkout
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            
                            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest mt-6 opacity-60"
                                style={{ color: tCol }}>
                                <ShieldCheck className="w-4 h-4" /> Secure SSL Checkout
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
