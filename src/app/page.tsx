"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import Footer from "@/components/Footer";
import {
  CheckCircle,
  MessageSquare,
  ArrowRight,
  Bot,
  Shield,
  Package,
  Bell,
  Play,
  TrendingUp,
  Store,
  Utensils,
  GraduationCap,
  Zap,
  Menu,
  X,
  ChevronDown,
  Quote,
  Star,
  ChevronUp,
  Sparkles,
  Globe,
  BarChart3,
  Lock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import Image from "next/image";

/* ─────────────── data ─────────────── */

const businessNames = [
  "StyleMart", "TechGadgets", "Organic Beauty", "Fresh Bites",
  "Urban Fitness", "Craft Corner", "Home Comfort", "Gadget World",
  "Sweet Treats", "Auto Parts Pro", "Fashion Forward", "Pet Paradise",
];

const features = [
  {
    icon: Bot,
    title: "AI Sales Agent",
    desc: "A tireless 24/7 rep that qualifies leads, answers FAQs, and closes deals — all on autopilot.",
    accent: "#25D366",
  },
  {
    icon: MessageSquare,
    title: "Smart Cart",
    desc: "Customers order in plain English. The AI extracts intent and builds the cart automatically.",
    accent: "#25D366",
  },
  {
    icon: Zap,
    title: "Auto Discounts",
    desc: "Rule-based coupon engine fires at exactly the right moment to rescue abandoned carts.",
    accent: "#25D366",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    desc: "Push notifications for every order, refund, or support escalation — never miss a beat.",
    accent: "#25D366",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    desc: "Funnel reports, cohort charts, and revenue attribution that actually make sense.",
    accent: "#25D366",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    desc: "AES-256 at rest, TLS in transit, zero WhatsApp session storage. Sleep soundly.",
    accent: "#25D366",
  },
];

const steps = [
  { num: "01", title: "Connect WhatsApp", desc: "Scan a QR code. Done. No API approvals, no waiting." },
  { num: "02", title: "Upload Products", desc: "CSV, manual entry, or sync from Shopify in seconds." },
  { num: "03", title: "Go Live", desc: "Your AI sales rep starts chatting, selling, and converting." },
];

const testimonials = [
  {
    quote: "This AI has completely transformed how we handle customer inquiries. We're processing 3× more orders with zero extra headcount.",
    author: "Sarah Chen",
    role: "Owner, StyleMart",
    avatar: "SC",
    rating: 5,
  },
  {
    quote: "Setup took literally 5 minutes. Now our customers get instant responses at any hour and our cart abandonment dropped 40%.",
    author: "Michael Rodriguez",
    role: "Founder, TechGadgets",
    avatar: "MR",
    rating: 5,
  },
  {
    quote: "The AI understands context so well — it's like having a dedicated sales rep who never sleeps, never gets tired, never has a bad day.",
    author: "Emma Thompson",
    role: "CEO, Organic Beauty",
    avatar: "ET",
    rating: 5,
  },
];

const faqs = [
  {
    q: "Is this the official WhatsApp Business API?",
    a: "No. We use WhatsApp Web technology to connect to your existing number — no Meta approval needed, no 30-day wait. You get all the automation benefits immediately.",
  },
  {
    q: "How long does setup really take?",
    a: "Under 5 minutes for most stores. Scan QR → upload products → set your policies → done. The AI learns your catalog instantly.",
  },
  {
    q: "Can I customize how the AI talks?",
    a: "Absolutely. You control tone, product descriptions, discount rules, shipping policies, and even specific scripts for common scenarios.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. AES-256 encryption at rest, TLS 1.3 in transit, and we never store your WhatsApp session on our servers. You can wipe everything in one click.",
  },
  {
    q: "What happens if the AI can't answer something?",
    a: "It gracefully escalates to you with full conversation context. You step in, answer, and optionally train the AI so it handles it next time.",
  },
];

const targetAudiences = [
  { icon: Store, label: "Shopify Sellers" },
  { icon: Package, label: "Dropshippers" },
  { icon: Utensils, label: "Restaurants" },
  { icon: GraduationCap, label: "Coaches & Creators" },
  { icon: Globe, label: "Service Businesses" },
  { icon: RefreshCw, label: "Subscription Boxes" },
];

/* ─────────────── animation hook ─────────────── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700 ease-out", className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────── main component ─────────────── */

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      setShowSticky(window.scrollY > 600);
      setShowTop(window.scrollY > 1200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveSection(e.target.id)),
      { threshold: 0.4 }
    );
    sections.forEach((s) => obs.observe(s));
    return () => sections.forEach((s) => obs.unobserve(s));
  }, []);

  return (
    <div
      style={{ fontFamily: "var(--font-sora), var(--font-dm-sans), sans-serif", background: "#080C10" }}
      className="min-h-screen text-white overflow-x-hidden"
    >
      <style>{`
        .glow-text { text-shadow: 0 0 60px rgba(37,211,102,0.35); }
        .grid-bg {
          background-image:
            linear-gradient(rgba(37,211,102,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,211,102,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
        }
        .glass-dark {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
        }
        .green-glow { box-shadow: 0 0 40px rgba(37,211,102,0.25), 0 0 80px rgba(37,211,102,0.1); }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .card-hover:hover { transform: translateY(-4px); border-color: rgba(37,211,102,0.3) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(37,211,102,0.08); }
        .btn-primary {
          background: linear-gradient(135deg, #25D366 0%, #1aab52 100%);
          box-shadow: 0 4px 24px rgba(37,211,102,0.35);
          transition: all 0.25s ease;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(37,211,102,0.5); }
        .btn-primary:active { transform: translateY(0); }
        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          transition: all 0.25s ease;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.3); }
        .marquee { animation: marquee 28s linear infinite; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .pulse-ring {
          animation: pulseRing 2.4s ease-out infinite;
        }
        @keyframes pulseRing {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        .float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .float-slow { animation: float 9s ease-in-out infinite; }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .noise::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          border-radius: inherit;
        }
        .tag-pill {
          background: linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.05));
          border: 1px solid rgba(37,211,102,0.25);
        }
        .number-gradient {
          background: linear-gradient(135deg, #25D366, #7EFFC2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* ── NAV ── */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-500",
          scrolled ? "glass-dark border-b border-white/5 shadow-2xl" : ""
        )}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="Sellix Logo"
              width={36}
              height={36}
              className="rounded-lg"
            />

            <span style={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.2rem" }}>
              Sellix
            </span>
          </Link>



          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "#features", label: "Product" },
              { href: "#how", label: "How it works" },
              { href: "#pricing", label: "Pricing" },
              { href: "#faq", label: "FAQ" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  activeSection === l.href.slice(1)
                    ? "text-[#25D366] bg-[#25D366]/10"
                    : "text-white/60 hover:text-white hover:bg-white/06"
                )}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-white/60 hover:text-white transition-colors px-3 py-2">
              Log in
            </Link>
            <Link href="/signup">
              <button className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-2">
                Start free <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            {/* Mobile burger */}
            <button
              className="md:hidden glass rounded-full w-10 h-10 flex items-center justify-center"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div className={cn(
          "md:hidden glass-dark border-t border-white/05 overflow-hidden transition-all duration-400",
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}>
          <nav className="px-6 py-4 flex flex-col gap-1">
            {[
              { href: "#features", label: "Product" },
              { href: "#how", label: "How it works" },
              { href: "#pricing", label: "Pricing" },
              { href: "#faq", label: "FAQ" },
            ].map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="py-3 px-4 rounded-xl text-white/70 hover:text-white hover:bg-white/05 transition-all font-medium">
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-white/08 mt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block py-2 px-4 text-white/60 hover:text-white text-sm text-center">
                Log in
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden grid-bg noise">
        {/* Radial glow blobs */}
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: "900px", height: "600px",
          background: "radial-gradient(ellipse at center, rgba(37,211,102,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "0", right: "-10%",
          width: "500px", height: "500px",
          background: "radial-gradient(ellipse at center, rgba(37,211,102,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div
                className="tag-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ color: "#25D366" }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" />
                </span>
                AI-powered WhatsApp commerce
              </div>

              <h1
                style={{
                  fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                }}
              >
                Sell on WhatsApp{" "}
                <span className="number-gradient glow-text">24/7</span>
                <br />
                <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                  while you sleep.
                </span>
              </h1>

              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.1rem", lineHeight: 1.75, maxWidth: "520px" }}>
                Sellix turns WhatsApp into a fully automated sales machine. Your AI agent answers questions, processes orders, applies discounts, and follows up — all without lifting a finger.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/signup">
                  <button className="btn-primary text-white font-semibold px-8 py-4 rounded-full flex items-center gap-2 text-base">
                    Start for free
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <button className="btn-outline text-white font-medium px-8 py-4 rounded-full flex items-center gap-2 text-base">
                  <Play className="w-4 h-4 fill-white" />
                  Watch demo
                </button>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-2">
                  {["#e0c9b1", "#c2d4e8", "#d4c2e8", "#b1e0c9"].map((c, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-[#080C10]"
                      style={{ background: c }} />
                  ))}
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
                  <span style={{ color: "#fff", fontWeight: 600 }}>2,000+</span> businesses trust Sellix
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right — phone mockup */}
            <div className="relative flex justify-center float">
              {/* Outer glow ring */}
              <div style={{
                position: "absolute", inset: "-40px",
                background: "radial-gradient(ellipse at center, rgba(37,211,102,0.12) 0%, transparent 70%)",
                borderRadius: "50%",
              }} />

              {/* Phone */}
              <div style={{
                background: "linear-gradient(145deg, #1a1f2e, #0d1017)",
                borderRadius: "3rem",
                padding: "1rem",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(37,211,102,0.1)",
                width: "320px",
                position: "relative",
              }}>
                {/* Notch */}
                <div style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: "80px", height: "20px",
                  background: "#0d1017",
                  borderRadius: "0 0 12px 12px",
                }} />

                <div style={{ background: "#fff", borderRadius: "2.2rem", overflow: "hidden" }}>
                  {/* WA header */}
                  <div style={{
                    background: "linear-gradient(135deg, #25D366, #1aab52)",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Store className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>TechGadgets Store</p>
                      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem" }}>● online</p>
                    </div>
                  </div>

                  {/* Chat */}
                  <div style={{ background: "#ECE5DD", padding: "16px", minHeight: "340px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* User msg */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{
                        background: "#DCF8C6", borderRadius: "16px 16px 4px 16px",
                        padding: "8px 12px", fontSize: "0.8rem", color: "#111", maxWidth: "80%",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}>
                        Hi! What wireless headphones do you have?
                      </div>
                    </div>

                    {/* Bot reply */}
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div style={{
                        background: "#fff", borderRadius: "16px 16px 16px 4px",
                        padding: "10px 14px", fontSize: "0.8rem", color: "#111", maxWidth: "88%",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}>
                        <p style={{ marginBottom: "8px" }}>Hey! 👋 Here's what's hot right now:</p>
                        <div style={{
                          background: "#F5F5F5", borderRadius: "10px", padding: "8px",
                          marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px",
                        }}>
                          <div style={{
                            width: "40px", height: "40px", background: "#E0E0E0",
                            borderRadius: "8px", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: "1.2rem",
                          }}>🎧</div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: "0.75rem" }}>ProSound X1 — ANC</p>
                            <p style={{ color: "#25D366", fontWeight: 700, fontSize: "0.8rem" }}>$49.99</p>
                          </div>
                        </div>
                        <p style={{ fontSize: "0.72rem", color: "#666" }}>Reply *1* to order instantly ⚡</p>
                      </div>
                    </div>

                    {/* User */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{
                        background: "#DCF8C6", borderRadius: "16px 16px 4px 16px",
                        padding: "8px 12px", fontSize: "0.8rem", color: "#111",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}>
                        1
                      </div>
                    </div>

                    {/* Confirmation */}
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div style={{
                        background: "#fff", borderRadius: "16px 16px 16px 4px",
                        padding: "10px 14px", fontSize: "0.8rem",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}>
                        <p style={{ color: "#25D366", fontWeight: 700, marginBottom: "4px" }}>✅ Order #12345 confirmed!</p>
                        <p style={{ color: "#555", fontSize: "0.72rem" }}>ProSound X1 • $49.99 • Est. delivery 2–3 days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge — revenue */}
              <div className="float-slow" style={{
                position: "absolute", right: "-24px", top: "20%",
                background: "rgba(10,16,22,0.9)",
                border: "1px solid rgba(37,211,102,0.25)",
                borderRadius: "16px", padding: "10px 14px",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: "rgba(37,211,102,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <TrendingUp className="w-4 h-4" style={{ color: "#25D366" }} />
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>Today's revenue</p>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>+$2,840</p>
                </div>
              </div>

              {/* Floating badge — orders */}
              <div style={{
                position: "absolute", left: "-28px", bottom: "28%",
                background: "rgba(10,16,22,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px", padding: "10px 14px",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: "rgba(37,211,102,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Package className="w-4 h-4" style={{ color: "#25D366" }} />
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>Orders today</p>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>47 orders</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, insetInline: 0, height: "120px",
          background: "linear-gradient(to bottom, transparent, #080C10)",
          pointerEvents: "none",
        }} />
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", padding: "20px 0", overflow: "hidden" }}>
        <div className="flex">
          <div className="marquee flex gap-12 whitespace-nowrap">
            {businessNames.concat(businessNames).map((n, i) => (
              <span key={i} style={{ color: "rgba(255,255,255,0.25)", fontWeight: 500, fontSize: "0.85rem" }}>
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="py-20" style={{ background: "#080C10" }}>
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { v: "10K+", l: "Orders processed" },
                { v: "98%", l: "Customer satisfaction" },
                { v: "24/7", l: "AI availability" },
                { v: "3×", l: "Average revenue uplift" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="number-gradient" style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                    {s.v}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: "6px" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "96px 0", background: "#05080D" }}>
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <div className="tag-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-5" style={{ color: "#25D366" }}>
              <Sparkles className="w-4 h-4" /> Features
            </div>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: "1rem"
              }}
            >
              Everything you need.<br />
              <span
                style={{
                  color: "rgba(255,255,255,0.4)",
                  display: "inline-block",
                  marginTop: "0.6rem"
                }}
              >
                Nothing you don't.
              </span>
            </h2>

            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.05rem", maxWidth: "480px", margin: "0 auto" }}>
              Built for e-commerce operators who want results, not complexity.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="glass card-hover rounded-2xl p-6 h-full relative overflow-hidden">
                  <div className="shimmer absolute inset-0 rounded-2xl" />
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    background: "rgba(37,211,102,0.1)",
                    border: "1px solid rgba(37,211,102,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "20px",
                  }}>
                    <f.icon className="w-5 h-5" style={{ color: "#25D366" }} />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "10px", letterSpacing: "-0.01em" }}>
                    {f.title}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", lineHeight: 1.7 }}>
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: "96px 0", background: "#080C10" }}>
        <div className="max-w-5xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: "1rem",
              }}
            >
              Up in{" "}
              <span className="number-gradient">5 minutes</span>
              , not 5 weeks.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.05rem" }}>
              No developer, no complex API setup. Just scan and sell.
            </p>
          </Reveal>

          {/* Flex container for steps with arrows */}
          <div className="flex flex-col md:flex-row md:justify-center md:items-stretch gap-6 md:gap-4 relative">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                {/* Step Card */}
                <Reveal delay={index * 120} className="flex-1">
                  <div className="glass card-hover rounded-2xl p-8 relative text-center h-full">
                    <div
                      style={{
                        fontSize: "3rem",
                        fontWeight: 800,
                        background:
                          "linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.05))",
                        borderRadius: "50%",
                        width: "72px",
                        height: "72px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                        border: "1px solid rgba(37,211,102,0.2)",
                      }}
                    >
                      <span
                        className="number-gradient"
                        style={{ fontSize: "1.1rem", fontWeight: 800 }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        marginBottom: "10px",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: "0.9rem",
                        lineHeight: 1.7,
                      }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </Reveal>

                {/* Arrow between steps (except after last) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center px-2">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ opacity: 0.6 }}
                    >
                      <path
                        d="M5 12H19M19 12L13 6M19 12L13 18"
                        stroke="url(#arrow-gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <defs>
                        <linearGradient
                          id="arrow-gradient"
                          x1="5"
                          y1="12"
                          x2="19"
                          y2="12"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#25D366" />
                          <stop offset="1" stopColor="#128C7E" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERFECT FOR ── */}
      <section style={{ padding: "96px 0", background: "#05080D" }}>
        <div className="max-w-5xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: "1rem",
              }}
            >
              Built for every seller
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.05rem" }}>
              Whatever you sell, wherever you sell it.
            </p>
          </Reveal>

          {/* Responsive audience tags */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4">
            {targetAudiences.map((a, i) => (
              <Reveal key={i} delay={i * 60}>
                <div
                  className="glass card-hover flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-full cursor-pointer"
                >
                  <a.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#25D366" }} />
                  <span className="text-sm sm:text-base" style={{ fontWeight: 600 }}>
                    {a.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "96px 0", background: "#080C10" }}>
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
              Real stores,{" "}
              <span className="number-gradient">real results.</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="glass card-hover rounded-2xl p-7 flex flex-col h-full">
                  <Quote className="w-8 h-8 mb-5" style={{ color: "rgba(37,211,102,0.3)" }} />
                  <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: "0.9rem", flex: 1, marginBottom: "24px" }}>
                    "{t.quote}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #25D366, #1aab52)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "0.8rem", color: "#fff",
                    }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.author}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>{t.role}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "3px", marginTop: "16px" }}>
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "96px 0", background: "#05080D" }}>
        <div className="max-w-5xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <div className="tag-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-5" style={{ color: "#25D366" }}>
              Pricing
            </div>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
              Simple, transparent pricing.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: "32px" }}>Start free. Upgrade when you're ready.</p>

            {/* Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <span style={{ color: !isYearly ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 500, fontSize: "0.9rem" }}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                style={{
                  width: "52px", height: "28px",
                  background: isYearly ? "#25D366" : "rgba(255,255,255,0.1)",
                  borderRadius: "999px", padding: "3px",
                  border: "none", cursor: "pointer",
                  position: "relative", transition: "background 0.3s",
                }}
              >
                <div style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  background: "#fff",
                  position: "absolute", top: "3px",
                  left: isYearly ? "27px" : "3px",
                  transition: "left 0.3s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }} />
              </button>
              <span style={{ color: isYearly ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 500, fontSize: "0.9rem" }}>
                Yearly{" "}
                <span style={{ color: "#25D366", fontWeight: 700 }}>−20%</span>
              </span>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <Reveal delay={100}>
              <div className="glass card-hover rounded-2xl p-8 h-full flex flex-col">
                <div style={{ marginBottom: "6px", fontWeight: 700, fontSize: "1rem" }}>Starter</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginBottom: "24px" }}>For early-stage stores</div>
                <div style={{ marginBottom: "28px" }}>
                  <span style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                    $0
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/mo</span>
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", flex: 1 }}>
                  {["200 orders/month", "50 products", "Basic analytics", "Email support"].map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#25D366" }} /> {f}
                    </li>
                  ))}
                </ul>
                <button className="btn-outline text-white font-semibold py-3 rounded-full w-full">
                  Get started
                </button>
              </div>
            </Reveal>

            {/* Growth — featured */}
            <Reveal delay={200}>
              <div style={{
                background: "linear-gradient(145deg, rgba(37,211,102,0.12), rgba(37,211,102,0.04))",
                border: "1px solid rgba(37,211,102,0.35)",
                borderRadius: "1rem", padding: "2rem",
                position: "relative",
                boxShadow: "0 0 60px rgba(37,211,102,0.1)",
              }} className="h-full flex flex-col card-hover">
                <div style={{
                  position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                  background: "linear-gradient(135deg, #25D366, #1aab52)",
                  color: "#fff", fontWeight: 700, fontSize: "0.75rem",
                  padding: "4px 16px", borderRadius: "999px",
                  boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
                }}>Most Popular</div>
                <div style={{ marginBottom: "6px", fontWeight: 700, fontSize: "1rem" }}>Growth</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginBottom: "24px" }}>For scaling businesses</div>
                <div style={{ marginBottom: "28px" }}>
                  <span className="number-gradient" style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.03em" }}>${isYearly ? "39" : "49"}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/mo</span>
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", flex: 1 }}>
                  {["2,000 orders/month", "Unlimited products", "Advanced analytics", "Priority support", "Smart cart recovery"].map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#25D366" }} /> {f}
                    </li>
                  ))}
                </ul>
                <button className="btn-primary text-white font-semibold py-3 rounded-full w-full">
                  Get started
                </button>
              </div>
            </Reveal>

            {/* Pro */}
            <Reveal delay={300}>
              <div className="glass card-hover rounded-2xl p-8 h-full flex flex-col">
                <div style={{ marginBottom: "6px", fontWeight: 700, fontSize: "1rem" }}>Pro</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginBottom: "24px" }}>Enterprise-grade power</div>
                <div style={{ marginBottom: "28px" }}>
                  <span style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.03em" }}>${isYearly ? "79" : "99"}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/mo</span>
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", flex: 1 }}>
                  {["Unlimited orders", "Unlimited products", "Full analytics suite", "Dedicated account manager", "Custom AI training"].map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#25D366" }} /> {f}
                    </li>
                  ))}
                </ul>
                <button className="btn-outline text-white font-semibold py-3 rounded-full w-full">
                  Contact sales
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "96px 0", background: "#080C10" }}>
        <div className="max-w-2xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Questions?
            </h2>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {faqs.map((f, i) => (
              <Reveal key={i} delay={i * 50}>
                <div
                  className="glass rounded-2xl overflow-hidden"
                  style={{ border: openFaq === i ? "1px solid rgba(37,211,102,0.25)" : undefined }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center",
                      justifyContent: "space-between", padding: "18px 20px",
                      background: "transparent", border: "none", cursor: "pointer",
                      color: "#fff", textAlign: "left",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{f.q}</span>
                    <ChevronDown
                      className="w-5 h-5 flex-shrink-0 transition-transform duration-300"
                      style={{
                        color: openFaq === i ? "#25D366" : "rgba(255,255,255,0.4)",
                        transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>
                  <div style={{
                    maxHeight: openFaq === i ? "200px" : "0",
                    opacity: openFaq === i ? 1 : 0,
                    overflow: "hidden",
                    transition: "all 0.35s ease",
                  }}>
                    <div style={{ padding: "0 20px 18px", color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.8 }}>
                      {f.a}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "96px 24px", background: "#05080D", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, rgba(37,211,102,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <Reveal>
            <div className="tag-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ color: "#25D366" }}>
              <Sparkles className="w-4 h-4" /> Start today — free
            </div>
            <h2 style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1.5rem" }}>
              Your AI sales rep is{" "}
              <span className="number-gradient">ready to work.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.1rem", marginBottom: "40px", maxWidth: "480px", margin: "0 auto 40px" }}>
              Join 2,000+ businesses. 14-day free trial. No credit card needed. Cancel any time.
            </p>
            <Link href="/signup">
              <button className="btn-primary text-white font-bold px-10 py-5 rounded-full text-base flex items-center gap-2 mx-auto green-glow">
                Start selling for free
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Sticky CTA */}
      <div style={{
        position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
        zIndex: 40,
        opacity: showSticky ? 1 : 0,
        pointerEvents: showSticky ? "auto" : "none",
        transition: "opacity 0.4s ease",
      }}>
        <Link href="/signup">
          <button className="btn-primary green-glow text-white font-semibold px-8 py-4 rounded-full flex items-center gap-2 text-sm">
            Start selling for free <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 40,
          width: "44px", height: "44px",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", backdropFilter: "blur(12px)",
          opacity: showTop ? 1 : 0,
          pointerEvents: showTop ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
      >
        <ChevronUp className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}