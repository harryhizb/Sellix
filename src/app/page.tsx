"use client";

import React from "react";
import { useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { ArrowRight, Zap, Users, ShoppingBag, TrendingUp, Play, ChevronRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  from?: "up" | "left" | "right";
}

interface FaqItem { q: string; a: string }
interface TestiItem { quote: string; author: string; role: string; initials: string }
interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
  category?: string;
  color?: string;
  size?: number;
}
interface StepItem { num: string; icon: string; title: string; desc: string }
interface PriceItem { plan: string; desc: string; price: string; yearly: string; features: string[]; featured?: boolean; cta: string }
interface PainItem { icon: string; title: string; desc: string }
interface StatItem { value: string; label: string; accent: boolean }

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */
const BRANDS = [
  "StyleMart", "TechGadgets", "Organic Beauty", "Fresh Bites", "Urban Fitness",
  "Craft Corner", "Sweet Treats", "Auto Parts Pro", "Fashion Forward", "Pet Paradise",
  "Daily Deals", "Bloom Studio", "Neon Apparel", "Glow Skincare", "Pixel Merch",
];

const PAINS: PainItem[] = [
  {
    icon: "😴",
    title: "Missed orders while you sleep",
    desc: "Every unanswered 2 AM message is a lost sale you'll never recover. Customers don't wait — they move on.",
  },
  {
    icon: "🔁",
    title: "Same questions, every single day",
    desc: '"What\'s the price?" "Do you have XL?" Copying and pasting answers all day kills your focus and your growth.',
  },
  {
    icon: "🔗",
    title: "No real store to send people to",
    desc: "Blurry catalogue screenshots don't close deals. Customers need a real checkout experience to buy with confidence.",
  },
  {
    icon: "📊",
    title: "Zero visibility into your business",
    desc: "Orders scattered across chat threads, no dashboard, no tracking — pure chaos as you try to scale.",
  },
];

const STEPS: StepItem[] = [
  { num: "01", icon: "⚙️", title: "Create your account", desc: "Set your store name, add products with photos & prices, and configure your policies — all in minutes." },
  { num: "02", icon: "📱", title: "Connect WhatsApp", desc: "Scan a QR code and your 24/7 AI sales agent goes live instantly. No Meta API approval needed." },
  { num: "03", icon: "🔗", title: "Share your store link", desc: "Post your storefront on Instagram, WhatsApp Status, or anywhere your customers already are." },
  { num: "04", icon: "🤑", title: "Watch orders roll in", desc: "Web checkout or WhatsApp chat — every order lands in your unified dashboard. Automatically." },
];

/* ─── CONSTELLATION DATA ─── */
const STAR_POSITIONS = [
  { x: 50, y: 8 },  // top center     — 0
  { x: 82, y: 21 },  // top right      — 1
  { x: 93, y: 50 },  // right          — 2
  { x: 79, y: 79 },  // bottom right   — 3
  { x: 50, y: 92 },  // bottom center  — 4
  { x: 21, y: 79 },  // bottom left    — 5
  { x: 7, y: 50 },  // left           — 6
  { x: 18, y: 21 },  // top left       — 7
];

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  [0, 4], [2, 6], [1, 5], [3, 7]
];

const LEGEND_ITEMS = [
  { label: "Core", color: "#25D366" },
  { label: "Commerce", color: "#7EFFC2" },
  { label: "Intelligence", color: "#5BC8F5" },
  { label: "Growth", color: "#F5A05B" },
];

const FEATURES: FeatureItem[] = [
  { icon: "🏪", title: "Instant Storefront", desc: "A professional one-page shop with listings, images, and pricing — ready to share via link.", category: "commerce", color: "#7EFFC2", size: 52 },
  { icon: "🛒", title: "Cart & Checkout", desc: "Customers browse, add to cart, and complete checkout with delivery details on the web.", category: "commerce", color: "#7EFFC2", size: 46 },
  { icon: "💬", title: "WhatsApp Orders", desc: "Customers can also order via WhatsApp chat. AI creates the order automatically from the conversation.", category: "core", color: "#25D366", size: 54 },
  { icon: "🔔", title: "Dual Notifications", desc: "Both you and your customer receive instant WhatsApp confirmations the moment an order is placed.", category: "core", color: "#25D366", size: 46 },
  { icon: "🤖", title: "AI Conversations", desc: "Your agent answers FAQs, handles product queries, and closes deals without you lifting a finger.", category: "intelligence", color: "#5BC8F5", size: 58 },
  { icon: "📊", title: "Order Dashboard", desc: "All orders — from web and WhatsApp — in one unified dashboard. Track, manage, and export.", category: "intelligence", color: "#5BC8F5", size: 46 },
  { icon: "⚡", title: "Auto Discounts", desc: "Smart coupon engine fires at the right moment to rescue abandoned carts and reward loyalty.", category: "growth", color: "#F5A05B", size: 46 },
  { icon: "🔒", title: "Secure by Default", desc: "AES-256 at rest, TLS in transit. Your data and your customers' data are always protected.", category: "growth", color: "#F5A05B", size: 44 },
];

const TESTIMONIALS: TestiItem[] = [
  {
    quote: "I used to spend hours replying to the same questions every day. Now the AI handles everything and I'm actually getting more orders — while sleeping.",
    author: "Sara Khan",
    role: "Owner, StyleMart",
    initials: "SK",
  },
  {
    quote: "The storefront looks so professional. Customers think I have a huge team behind me. Setup was honestly under 10 minutes. Absolutely wild.",
    author: "Ahmed Raza",
    role: "Founder, TechGadgets",
    initials: "AR",
  },
  {
    quote: "I run my entire business from my phone. Waplify handles the website AND the WhatsApp conversations. It's honestly a cheat code.",
    author: "Fatima Ali",
    role: "CEO, Organic Beauty",
    initials: "FA",
  },
  {
    quote: "Before Waplify I was copy-pasting the same reply 50 times a day. Now I just check the dashboard and fulfil orders. Total game changer.",
    author: "Omar Sheikh",
    role: "Founder, Fresh Bites",
    initials: "OS",
  },
  {
    quote: "My customers always ask if I have a big team. Nope — just Waplify running 24/7 while I sleep. The storefront looks insane.",
    author: "Layla Hassan",
    role: "Owner, Bloom Studio",
    initials: "LH",
  },
  {
    quote: "Went from zero online presence to a fully automated store in one afternoon. Can't believe this is free to start.",
    author: "Bilal Chaudhry",
    role: "CEO, Urban Fitness",
    initials: "BC",
  },
  {
    quote: "My restaurant gets orders on WhatsApp all night. Used to miss half of them. Now every single order is captured automatically.",
    author: "Nadia Malik",
    role: "Owner, Spice Route",
    initials: "NM",
  },
  {
    quote: "Five stars isn't enough. Setup took 7 minutes, and by next morning I had 3 new orders from the storefront link I posted on Instagram.",
    author: "Zara Ahmed",
    role: "Founder, Craft Corner",
    initials: "ZA",
  },
];

const PRICING: PriceItem[] = [
  {
    plan: "Starter",
    desc: "Perfect for new businesses",
    price: "$0",
    yearly: "$0",
    cta: "Get started free",
    features: [
      "Storefront website included",
      "200 orders / month",
      "Up to 50 products",
      "WhatsApp AI agent",
      "Email support",
    ],
  },
  {
    plan: "Growth",
    desc: "For businesses ready to scale",
    price: "$49",
    yearly: "$39",
    cta: "Start growing",
    featured: true,
    features: [
      "Everything in Starter",
      "2,000 orders / month",
      "Unlimited products",
      "Advanced analytics",
      "Priority support",
      "Smart cart recovery",
    ],
  },
  {
    plan: "Scale",
    desc: "Enterprise-grade power",
    price: "$99",
    yearly: "$79",
    cta: "Contact sales",
    features: [
      "Everything in Growth",
      "Unlimited orders",
      "Full analytics suite",
      "Dedicated account manager",
      "Custom AI training",
      "White-label storefront",
    ],
  },
];

const FAQS: FaqItem[] = [
  { q: "Do I need a developer to set up my storefront?", a: "Not at all. The entire setup — store, products, branding, and WhatsApp connection — takes under 10 minutes with zero technical skills." },
  { q: "Can customers order from both the website and WhatsApp?", a: "Yes. Customers can browse and checkout via your storefront link, or order through WhatsApp chat. All orders appear in one unified dashboard." },
  { q: "Is this the official WhatsApp Business API?", a: "We use WhatsApp Web technology — no Meta approval needed, no month-long wait. You get automation benefits immediately after scanning the QR code." },
  { q: "Can I customize the storefront design?", a: "Yes. You can customize colors, logo, banner, product layout, and more from the visual editor in your dashboard — no code needed." },
  { q: "What happens if the AI can't answer something?", a: "It gracefully escalates to you with the full conversation context so you can step in and reply directly. You stay in control at all times." },
  { q: "What types of businesses can use Sellix?", a: "Any business that communicates via WhatsApp — e-commerce sellers, restaurants, coaches, service providers, NGOs, and more." },
];

const AUDIENCES = [
  "🛍️ Instagram Sellers",
  "📦 Dropshippers",
  "🍽️ Restaurants",
  "🎓 Coaches & Creators",
  "🌐 Service Businesses",
  "🔄 Subscription Boxes",
  "🏥 Clinics & NGOs",
  "🎨 Artisans",
];

const STATS: StatItem[] = [
  { value: "5,000+", label: "Businesses powered", accent: true },
  { value: "120K+", label: "Orders processed", accent: false },
  { value: "98%", label: "Customer satisfaction", accent: true },
  { value: "24/7", label: "Automated responses", accent: false },
];

/* ─────────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────────── */
function useIntersect(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function useTypewriter(texts: string[], speed = 65, pause = 2200) {
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = texts[idx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        if (charIdx < current.length) setCharIdx((c) => c + 1);
        else setTimeout(() => setDeleting(true), pause);
      } else {
        if (charIdx > 0) setCharIdx((c) => c - 1);
        else { setDeleting(false); setIdx((i) => (i + 1) % texts.length); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, idx, texts, speed, pause]);
  return texts[idx].slice(0, charIdx);
}

/* ─────────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "", from = "up" }: RevealProps) {
  const { ref, visible } = useIntersect();
  const map = { up: "translateY(28px)", left: "translateX(-28px)", right: "translateX(28px)" };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : map[from],
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PULSING DOT
─────────────────────────────────────────────────────────────── */
function PulsingDot({ color = "#22C55E" }: { color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7, flexShrink: 0 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color, opacity: 0.7,
        animation: "h-ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
      }} />
      <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: color }} />
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────
   SECTION TAG
─────────────────────────────────────────────────────────────── */
function SectionTag({ children, color = "purple" }: { children: React.ReactNode; color?: "purple" | "green" | "red" }) {
  const palette = {
    purple: { bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.22)", text: "#A78BFA" },
    green: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", text: "#22C55E" },
    red: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", text: "rgba(252,165,165,0.9)" },
  }[color] || { bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.22)", text: "#A78BFA" };

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "5px 14px 5px 10px", borderRadius: 999, marginBottom: "2rem",
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      fontSize: "0.72rem", fontWeight: 700,
      color: palette.text, letterSpacing: "0.06em", textTransform: "uppercase" as const,
      fontFamily: "var(--font-outfit)",
    }}>
      <PulsingDot color={palette.text} />
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   CHAT BUBBLE
─────────────────────────────────────────────────────────────── */
function ChatBubble({ text, type, delay = 0 }: { text: string; type: "them" | "bot"; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  if (!show) return null;
  const isBot = type === "bot";
  return (
    <div style={{
      display: "flex", justifyContent: isBot ? "flex-start" : "flex-end",
      animation: "h-bubbleIn 0.35s cubic-bezier(0.22,1,0.36,1) both",
    }}>
      <div style={{
        maxWidth: "84%", padding: "9px 13px",
        borderRadius: isBot ? "16px 16px 16px 3px" : "16px 16px 3px 16px",
        background: isBot ? "rgba(124,58,237,0.15)" : "rgba(34,197,94,0.12)",
        border: `1px solid ${isBot ? "rgba(124,58,237,0.18)" : "rgba(34,197,94,0.18)"}`,
        fontSize: "0.71rem", lineHeight: 1.6, color: "rgba(255,255,255,0.82)",
        fontFamily: "var(--font-outfit)",
      }} dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.65)" }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.6rem", color: "#22C55E", fontWeight: 800,
      }}>✓</div>
      {text}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTIONS
───────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────
   LIVE TICKER (scrolling order feed)
─────────────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  { name: "Sara K.", item: "Floral Dress M", amount: "$34" },
  { name: "Ahmed R.", item: "Leather Wallet", amount: "$52" },
  { name: "Lina M.", item: "Gold Earrings", amount: "$28" },
  { name: "Omar S.", item: "Running Shoes XL", amount: "$89" },
  { name: "Zara T.", item: "Silk Scarf", amount: "$41" },
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % TICKER_ITEMS.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(cycle);
  }, []);
  const item = TICKER_ITEMS[idx];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 12px 6px 8px",
      background: "rgba(34,197,94,0.07)", borderRadius: 999,
      border: "1px solid rgba(34,197,94,0.16)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-6px)",
      transition: "opacity 0.28s ease, transform 0.28s ease",
      minWidth: 220,
    }}>
      <PulsingDot />
      <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.38)", fontFamily: "var(--font-outfit)" }}>
        <span style={{ color: "#86EFAC", fontWeight: 700 }}>{item.name}</span>
        {" just ordered "}
        <span style={{ color: "rgba(255,255,255,0.6)" }}>{item.item}</span>
        {" · "}
        <span style={{ color: "#22C55E", fontWeight: 700 }}>{item.amount}</span>
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SPOTLIGHT (follows mouse, subtle)
─────────────────────────────────────────────────────────────── */
function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const r = ref.current.parentElement?.getBoundingClientRect();
      if (!r) return;
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      ref.current.style.background =
        `radial-gradient(600px circle at ${x}px ${y}px, rgba(124,58,237,0.07) 0%, transparent 55%)`;
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div ref={ref} style={{
      position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
      transition: "background 0.15s ease",
    }} />
  );
}

/* ──────────────────────────────────────────────────────────────
   PHONE FRAME
─────────────────────────────────────────────────────────────── */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(160deg, #17102B 0%, #0C0918 100%)",
      borderRadius: "2.8rem",
      border: "1px solid rgba(124,58,237,0.22)",
      boxShadow: [
        "0 0 0 1px rgba(124,58,237,0.08)",
        "0 40px 100px rgba(0,0,0,0.85)",
        "0 8px 32px rgba(124,58,237,0.12)",
        "inset 0 0 40px rgba(124,58,237,0.025)",
      ].join(","),
      overflow: "hidden",
      maxWidth: 292, margin: "0 auto",
      animation: "h-float 8s ease-in-out infinite",
    }}>
      {/* Notch */}
      <div style={{
        position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
        width: 88, height: 26, borderRadius: 999,
        background: "#07060E",
        border: "1px solid rgba(124,58,237,0.12)",
        zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: "rgba(124,58,237,0.35)",
          boxShadow: "0 0 6px rgba(124,58,237,0.4)",
        }} />
        <div style={{ width: 24, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.08)" }} />
      </div>
      {/* Side buttons (decorative) */}
      <div style={{
        position: "absolute", right: -2, top: "30%",
        width: 3, height: 48, borderRadius: "0 2px 2px 0",
        background: "rgba(124,58,237,0.2)",
      }} />
      {/* Screen glow */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
        background: "linear-gradient(to top, rgba(124,58,237,0.06), transparent)",
        pointerEvents: "none", zIndex: 1,
      }} />
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   FLOATING CARD
─────────────────────────────────────────────────────────────── */
function FloatCard({
  icon, label, value, valueColor, borderColor, bgColor, style
}: {
  icon: string; label: string; value: string;
  valueColor?: string; borderColor?: string; bgColor?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      position: "absolute",
      background: "rgba(8,7,13,0.92)",
      border: `1px solid ${borderColor || "rgba(255,255,255,0.09)"}`,
      borderRadius: "1.15rem", padding: "0.85rem 1.1rem",
      backdropFilter: "blur(24px)",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 20px 60px rgba(0,0,0,0.65)",
      minWidth: 185,
      ...style,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: bgColor || "rgba(255,255,255,0.05)",
        border: `1px solid ${borderColor || "rgba(255,255,255,0.08)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.1rem", flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{
          fontSize: "0.58rem", color: "rgba(255,255,255,0.3)",
          fontWeight: 700, textTransform: "uppercase" as const,
          letterSpacing: "0.07em", marginBottom: 2,
          fontFamily: "var(--font-outfit)",
        }}>{label}</div>
        <div style={{
          fontFamily: "var(--font-outfit)", fontSize: "0.82rem",
          fontWeight: 800, color: valueColor || "#fff",
          lineHeight: 1.2,
        }} dangerouslySetInnerHTML={{ __html: value }} />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   TRUST PILL
─────────────────────────────────────────────────────────────── */
function TrustPill({ text }: { text: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 13px", borderRadius: 999,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      fontSize: "0.75rem", color: "rgba(255,255,255,0.38)",
      fontFamily: "var(--font-outfit)", fontWeight: 500,
      transition: "background 0.2s, border-color 0.2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
    >
      <span style={{ color: "#22C55E", fontSize: 10 }}>✦</span> {text}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO SECTION
══════════════════════════════════════════════════════════════ */
export function HeroSection() {
  const typed = useTypewriter(["your storefront.", "your sales rep.", "your 24/7 team.", "your growth engine."]);
  const [primaryHover, setPrimaryHover] = useState(false);
  const [demoHover, setDemoHover] = useState(false);

  return (
    <section style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center",
      padding: "8rem 2rem 5rem",
      position: "relative", overflow: "hidden",
      background: "#08070D",
    }}>

      {/* ── mouse spotlight ── */}
      <Spotlight />

      {/* ── dot-grid background ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: [
          "linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 90% 65% at 50% 0%, #000 20%, transparent 85%)",
        WebkitMaskImage: "radial-gradient(ellipse 90% 65% at 50% 0%, #000 20%, transparent 85%)",
      }} />

      {/* ── scanline ── */}
      <div style={{
        position: "absolute", left: 0, right: 0, height: 1, zIndex: 0,
        background: "linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.35) 30%, rgba(34,197,94,0.25) 65%, transparent 100%)",
        animation: "h-scan 10s linear infinite",
        opacity: 0.7,
      }} />

      {/* ── orbs ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-20%", left: "18%",
          width: 720, height: 720, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 60%)",
        }} />
        <div style={{
          position: "absolute", bottom: "0%", right: "10%",
          width: 520, height: 520, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(34,197,94,0.05) 0%, transparent 65%)",
        }} />
        {/* diagonal accent line */}
        <div style={{
          position: "absolute", top: "8%", right: "38%",
          width: 1, height: "45%",
          background: "linear-gradient(to bottom, transparent, rgba(124,58,237,0.18), transparent)",
          transform: "rotate(12deg)",
        }} />
      </div>

      {/* ── main content wrapper ── */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 1240, margin: "0 auto",
        display: "flex", alignItems: "center",
        gap: "3.5rem", flexWrap: "wrap" as const,
      }}>

        {/* ─────────── LEFT COLUMN ─────────── */}
        <div style={{
          flex: "1 1 460px", minWidth: 300,
          animation: "h-in 0.75s cubic-bezier(0.22,1,0.36,1) both",
        }}>

          <SectionTag>WhatsApp Commerce Platform</SectionTag>

          {/* Live ticker */}
          <div style={{ marginBottom: "1.75rem" }}>
            <LiveTicker />
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "var(--font-outfit)", fontWeight: 800,
            fontSize: "clamp(2.5rem, 5.5vw, 4.4rem)",
            lineHeight: 0.95, letterSpacing: "-0.045em",
            marginBottom: "1.6rem", margin: "0 0 1.6rem",
          }}>
            <span style={{
              display: "block", color: "#fff",
              textShadow: "0 0 80px rgba(124,58,237,0.2)",
            }}>
              Launch your store.
            </span>
            <span style={{
              display: "block",
              fontStyle: "italic", fontWeight: 400,
              fontSize: "1.04em",
              background: "linear-gradient(125deg,#7C3AED 0%,#A855F7 32%,#22C55E 68%,#7C3AED 100%)",
              backgroundSize: "300% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              animation: "h-shimmer 6s linear infinite",
            }}>
              Sell on WhatsApp.
            </span>
          </h1>

          {/* Typewriter line */}
          <p style={{
            fontFamily: "var(--font-outfit)",
            fontSize: "clamp(0.95rem, 1.4vw, 1.08rem)",
            color: "rgba(255,255,255,0.35)", marginBottom: "0.6rem",
            letterSpacing: "-0.01em",
          }}>
            Powered by{" "}
            <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
              {typed}
              <span style={{
                animation: "h-blink 1s step-end infinite",
                color: "#22C55E", marginLeft: 1,
              }}>|</span>
            </span>
          </p>

          {/* Body copy */}
          <p style={{
            fontSize: "clamp(0.9rem, 1.4vw, 1.02rem)",
            color: "rgba(255,255,255,0.42)", lineHeight: 1.8,
            maxWidth: 490, marginBottom: "2.5rem",
            fontFamily: "var(--font-outfit)",
          }}>
            Create a professional storefront, accept orders through checkout, and automate every
            WhatsApp conversation — all from one platform.{" "}
            <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>Setup in 5 minutes.</span>
          </p>

          {/* CTA row */}
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" as const, marginBottom: "2.75rem", alignItems: "center" }}>

            {/* Primary */}
            <button
              onMouseEnter={() => setPrimaryHover(true)}
              onMouseLeave={() => setPrimaryHover(false)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 9,
                background: primaryHover
                  ? "linear-gradient(90deg,#16a34a,#22c55e)"
                  : "#22C55E",
                color: "#08070D",
                fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: "0.92rem",
                padding: "0.92rem 2rem", borderRadius: 999, border: "none", cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
                transform: primaryHover ? "translateY(-2px) scale(1.02)" : "translateY(0) scale(1)",
                boxShadow: primaryHover
                  ? "0 0 0 8px rgba(34,197,94,0.1), 0 16px 48px rgba(34,197,94,0.5)"
                  : "0 8px 28px rgba(34,197,94,0.28)",
                letterSpacing: "-0.01em",
              }}>
              <Zap size={15} fill="#08070D" stroke="#08070D" />
              Start Free
              <ChevronRight size={14} style={{
                transform: primaryHover ? "translateX(3px)" : "translateX(0)",
                transition: "transform 0.25s ease",
              }} />
            </button>

            {/* Demo */}
            <button
              onMouseEnter={() => setDemoHover(true)}
              onMouseLeave={() => setDemoHover(false)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 9,
                background: demoHover ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${demoHover ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"}`,
                color: demoHover ? "#fff" : "rgba(255,255,255,0.75)",
                fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "0.92rem",
                padding: "0.92rem 1.8rem", borderRadius: 999, cursor: "pointer",
                transition: "all 0.2s ease",
                transform: demoHover ? "translateY(-1px)" : "none",
                letterSpacing: "-0.01em",
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: demoHover ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}>
                <Play size={9} fill="currentColor" style={{ marginLeft: 1 }} />
              </div>
              Watch Demo
            </button>

          </div>

          {/* Social proof row */}
          <AvatarStack />

          {/* Trust pills */}
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.75rem", flexWrap: "wrap" as const }}>
            {["No code required", "Setup in 5 minutes", "Works with WhatsApp", "Cancel anytime"].map(t => (
              <TrustPill key={t} text={t} />
            ))}
          </div>

        </div>

        {/* ─────────── RIGHT COLUMN — PHONE ─────────── */}
        <div style={{
          flex: "1 1 380px", minWidth: 280,
          display: "flex", justifyContent: "center",
          animation: "h-in 0.9s 0.12s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 390 }}>

            {/* glow beneath phone */}
            <div style={{
              position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)",
              width: 260, height: 60,
              background: "radial-gradient(ellipse, rgba(124,58,237,0.28) 0%, transparent 70%)",
              filter: "blur(20px)",
              pointerEvents: "none",
            }} />

            <PhoneFrame>
              {/* Status bar */}
              <div style={{
                background: "#07060E",
                padding: "44px 16px 10px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "linear-gradient(135deg,#22C55E,#16A34A)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.05rem",
                    boxShadow: "0 0 16px rgba(34,197,94,0.35)",
                  }}>🛍️</div>
                  <div>
                    <div style={{
                      fontFamily: "var(--font-outfit)", fontSize: "0.77rem",
                      fontWeight: 800, color: "#fff", lineHeight: 1.2,
                    }}>Sellix Store AI</div>
                    <div style={{
                      fontSize: "0.6rem", color: "#22C55E",
                      display: "flex", alignItems: "center", gap: 4,
                      fontFamily: "var(--font-outfit)",
                    }}>
                      <PulsingDot /> Online 24/7
                    </div>
                  </div>
                </div>
                <div style={{
                  display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 2,
                }}>
                  <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-outfit)" }}>9:41</div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[3, 3, 3, 2].map((h, i) => (
                      <div key={i} style={{ width: 3, height: h * 1.5 + 3, borderRadius: 1, background: `rgba(255,255,255,${0.2 + i * 0.15})` }} />
                    ))}
                    <div style={{ width: 14, height: 7, border: "1px solid rgba(255,255,255,0.25)", borderRadius: 2, marginLeft: 2, padding: 1 }}>
                      <div style={{ width: "70%", height: "100%", background: "#22C55E", borderRadius: 1 }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat area */}
              <div style={{
                padding: "0.9rem 0.85rem 1rem",
                background: "linear-gradient(180deg,#0D0B1A 0%,#090811 100%)",
                display: "flex", flexDirection: "column" as const, gap: 9, minHeight: 340,
              }}>
                <ChatBubble text="Hey! Do you have the floral dress in size M? 👗" type="them" delay={200} />
                <ChatBubble
                  text="Yes! 🌸 <strong style='color:rgba(255,255,255,0.9)'>Floral Summer Dress — M</strong><br/>Price: <span style='color:#86EFAC;font-weight:700'>$34</span> · Ships in 1–2 days ✅<br/><br/>Shall I add it to your cart?"
                  type="bot" delay={900} />
                <ChatBubble text="Yes please! Can I pay online?" type="them" delay={1800} />
                <ChatBubble
                  text="✅ <strong style='color:rgba(255,255,255,0.9)'>Order #2847 confirmed!</strong><br/><br/>Pay → <span style='color:#86EFAC;font-weight:600'>store.sellix.io/pay/2847</span><br/>WhatsApp update on ship 📦"
                  type="bot" delay={2700} />
                {/* Typing indicator */}
                <div style={{
                  display: "flex", gap: 4,
                  padding: "9px 13px",
                  background: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.14)",
                  borderRadius: "16px 16px 16px 3px",
                  width: "fit-content",
                  animation: "h-in 0.4s 3.5s both",
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "rgba(167,139,250,0.6)",
                      animation: `h-bounce 1.1s ${i * 0.18}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </PhoneFrame>

            {/* ── Float card: new order ── */}
            <FloatCard
              icon="🔔" label="New Order"
              value="✅ Order #2847 — <span style='color:#22C55E'>$34</span>"
              borderColor="rgba(34,197,94,0.2)"
              bgColor="rgba(34,197,94,0.08)"
              style={{
                right: -68, top: "13%",
                animation: "h-floatB 5.5s ease-in-out infinite",
              }}
            />

            {/* ── Float card: revenue ── */}
            <FloatCard
              icon="📈" label="Revenue Today"
              value="<span style='color:#22C55E;font-size:0.9rem'>+$3,240</span> <span style='color:rgba(255,255,255,0.35);font-size:0.7rem'>↑ 28%</span>"
              borderColor="rgba(124,58,237,0.2)"
              bgColor="rgba(124,58,237,0.1)"
              style={{
                left: -76, bottom: "16%",
                animation: "h-floatB 7s ease-in-out infinite reverse",
              }}
            />

            {/* ── Float card: store live ── */}
            <div style={{
              position: "absolute", left: "50%", transform: "translateX(-50%)",
              bottom: -22,
              background: "rgba(8,7,13,0.9)",
              border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: 999, padding: "6px 14px 6px 10px",
              backdropFilter: "blur(20px)",
              display: "flex", alignItems: "center", gap: 7,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap" as const,
              animation: "h-floatA 6s ease-in-out infinite",
              zIndex: 5,
            }}>
              <PulsingDot />
              <span style={{
                fontSize: "0.65rem", fontWeight: 700,
                color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-outfit)",
                letterSpacing: "0.02em",
              }}>
                Your store is <span style={{ color: "#22C55E" }}>live</span> right now
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* ── bottom fade ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 180,
        background: "linear-gradient(to bottom, transparent, #08070D)",
        pointerEvents: "none", zIndex: 2,
      }} />

      {/* ── keyframes ── */}
      <style>{`
        @keyframes h-ping {
          75%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes h-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
        @keyframes h-scan {
          0% { top: -4px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes h-float {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }
        @keyframes h-floatA {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-7px); }
        }
        @keyframes h-floatB {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes h-in {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes h-bubbleIn {
          from { opacity: 0; transform: scale(0.92) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes h-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes h-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </section>
  );
}

function MarqueeBar() {
  return (
    <div style={{
      borderTop: "1px solid rgba(255,255,255,0.05)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: "rgba(255,255,255,0.015)",
      padding: "1rem 0", overflow: "hidden", position: "relative", zIndex: 1,
    }}>
      <div style={{ display: "flex", animation: "sellix-marquee 28s linear infinite", whiteSpace: "nowrap" }}>
        {[...BRANDS, ...BRANDS].map((b, i) => (
          <span key={i} style={{
            padding: "0 2.2rem",
            fontFamily: "var(--font-outfit)", fontSize: "0.78rem", fontWeight: 600,
            color: "rgba(218, 211, 211, 0.7)",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ color: "#7C3AED", fontSize: "0.45rem", opacity: 0.6 }}>◆</span>
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

function PainSection() {
  return (
    <section style={{
      background: "rgba(255,255,255,0.012)",
      padding: "6rem 2rem",
      position: "relative",
      zIndex: 1
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "5rem" }}>
          <Reveal>
            <SectionTag color="red">😤 The Problem</SectionTag>
            <div style={{ position: "relative", marginTop: "1.5rem" }}>
              <h2 style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 800,
                fontSize: "clamp(2.2rem,5vw,3.8rem)",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: 0,
                color: "white"
              }}>
                Selling on WhatsApp
              </h2>
              <span style={{
                fontFamily: "var(--font-outfit)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "rgba(255,255,255,0.28)",
                fontSize: "clamp(2rem,4.5vw,3.6rem)",
                letterSpacing: "-0.03em",
                display: "block",
                position: "relative",
                top: "-0.25em",
                marginTop: "0.25em"
              }}>
                shouldn't feel chaotic.
              </span>
            </div>
            <p style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "1.1rem",
              maxWidth: 540,
              margin: "0.5rem auto 0",
              lineHeight: 1.6
            }}>
              You're losing customers right now — not because your product is bad, but because of this:
            </p>
          </Reveal>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          alignItems: "stretch",
        }}>
          {PAINS.map((p, i) => (
            <div key={i} style={{
              height: "100%",
              display: "flex",
            }}>
              <Reveal delay={i * 80}> {/* Removed style={{ width: "100%" }} as Reveal doesn't accept it */}
                <div style={{
                  padding: "2.5rem 2rem",
                  borderRadius: "2rem",
                  background: "rgba(239,68,68,0.04)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "default",
                  transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                  height: "100%", /* This ensures all cards take full height of the grid cell */
                  display: "flex",
                  flexDirection: "column",
                  width: "100%", /* Ensure full width */
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                    e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(239,68,68,0.35)";
                    e.currentTarget.style.background = "rgba(239,68,68,0.06)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.18)";
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.background = "rgba(239,68,68,0.04)";
                  }}>
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "linear-gradient(90deg,transparent,rgba(239,68,68,0.3),transparent)",
                  }} />

                  {/* Icon - fixed height */}
                  <div style={{
                    fontSize: "2.5rem",
                    marginBottom: "1.5rem",
                    lineHeight: 1,
                    height: "3rem", /* Fixed height for icon */
                    display: "flex",
                    alignItems: "center",
                  }}>
                    {p.icon}
                  </div>

                  {/* Title - fixed height with max lines */}
                  <h3 style={{
                    fontFamily: "var(--font-outfit)",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    marginBottom: "0.75rem",
                    color: "white",
                    letterSpacing: "-0.02em",
                    minHeight: "3.5rem", /* Fixed minimum height for title */
                    display: "-webkit-box",
                    WebkitLineClamp: 2, /* Limit to 2 lines */
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.4,
                  }}>
                    {p.title}
                  </h3>

                  {/* Description - fixed height with max lines */}
                  <p style={{
                    fontSize: "0.95rem",
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.7,
                    margin: 0,
                    flex: "1", /* This helps with spacing */
                    display: "-webkit-box",
                    WebkitLineClamp: 4, /* Limit to 4 lines */
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: "6.5rem", /* Minimum height for description */
                  }}>
                    {p.desc}
                  </p>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how"
      style={{
        padding: "6rem 2rem",
        position: "relative",
        zIndex: 1,
        background: "rgba(255,255,255,0.008)", // subtle background for depth
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* ----- HEADING (with overlapping lines) ----- */}
        <div style={{ textAlign: "center", marginBottom: "5rem" }}>
          <Reveal>
            <SectionTag color="green">⚡ How it works</SectionTag>
            <div style={{ position: "relative", marginTop: "1.5rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 800,
                  fontSize: "clamp(2.2rem,5vw,3.8rem)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  marginBottom: 0,
                  color: "white",
                }}
              >
                Your online store —{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#22C55E,#86EFAC)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  live in 5 minutes.
                </span>
              </h2>
              <span
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.28)",
                  fontSize: "clamp(2rem,4.5vw,3.6rem)",
                  letterSpacing: "-0.03em",
                  display: "block",
                  position: "relative",
                  top: "-0.25em",
                  marginTop: "0.25em",
                }}
              >
                Not 5 weeks.
              </span>
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "1.1rem",
                maxWidth: 540,
                margin: "0.5rem auto 0",
                lineHeight: 1.6,
              }}
            >
              No developer. No API approval. Just scan and start selling.
            </p>
          </Reveal>
        </div>

        {/* ----- CARDS with modern “horizontal line arrow” design ----- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "2rem",
            alignItems: "stretch",
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={i}
              style={{
                height: "100%",
                display: "flex",
              }}
            >
              <Reveal delay={i * 90}>
                <div
                  style={{
                    padding: "2.5rem 2rem",
                    borderRadius: "2rem",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "default",
                    transition:
                      "transform 0.35s cubic-bezier(0.22,1,0.36,1), border-color 0.25s, box-shadow 0.3s, background 0.3s",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    backdropFilter: "blur(4px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                    e.currentTarget.style.borderColor = "rgba(34,197,94,0.25)";
                    e.currentTarget.style.boxShadow =
                      "0 30px 60px -15px rgba(34,197,94,0.2)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  }}
                >
                  {/* Top horizontal line with arrow (modern shape) */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background:
                        "linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "-1px",
                      right: "20px",
                      width: 0,
                      height: 0,
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderTop: "8px solid rgba(34,197,94,0.3)",
                      transform: "rotate(45deg)",
                    }}
                  />

                  {/* Step number with line extension */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-outfit)",
                        fontStyle: "italic",
                        fontSize: "3rem",
                        fontWeight: 400,
                        lineHeight: 1,
                        background: "linear-gradient(135deg,#22C55E,#86EFAC)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {s.num}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background:
                          "linear-gradient(90deg, rgba(34,197,94,0.3), transparent)",
                      }}
                    />
                    {/* Small arrow at the end of the line */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ opacity: 0.5 }}
                    >
                      <path
                        d="M1 8H15M15 8L8 1M15 8L8 15"
                        stroke="#22C55E"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Icon with fixed height */}
                  <div
                    style={{
                      fontSize: "2.5rem",
                      marginBottom: "1.25rem",
                      lineHeight: 1,
                      height: "3rem",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {s.icon}
                  </div>

                  {/* Title (max 2 lines) */}
                  <h3
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      marginBottom: "0.75rem",
                      color: "white",
                      letterSpacing: "-0.02em",
                      minHeight: "3.5rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.4,
                    }}
                  >
                    {s.title}
                  </h3>

                  {/* Description (max 4 lines) */}
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "rgba(255,255,255,0.55)",
                      lineHeight: 1.7,
                      margin: 0,
                      flex: "1",
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "6.5rem",
                    }}
                  >
                    {s.desc}
                  </p>

                  {/* Subtle bottom arrow line (optional) */}
                  <div
                    style={{
                      marginTop: "1.5rem",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <svg
                      width="20"
                      height="12"
                      viewBox="0 0 20 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ opacity: 0.3 }}
                    >
                      <path
                        d="M1 6H19M19 6L13 1M19 6L13 11"
                        stroke="white"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function ProductShowcaseSection() {
  return (
    <section
      id="product"
      style={{
        background: "radial-gradient(circle at 30% 30%, rgba(124,58,237,0.08), transparent 50%), #0a0a0f",
        padding: "6rem 2rem",
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {/* Decorative background elements */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "10%",
        width: "300px",
        height: "300px",
        background: "rgba(34,197,94,0.1)",
        borderRadius: "50%",
        filter: "blur(80px)",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%",
        right: "5%",
        width: "400px",
        height: "400px",
        background: "rgba(124,58,237,0.1)",
        borderRadius: "50%",
        filter: "blur(100px)",
        zIndex: 0,
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
        {/* HEADING with overlapping effect */}
        <div style={{ textAlign: "center", marginBottom: "5rem" }}>
          <Reveal>
            <SectionTag>🧩 The Platform</SectionTag>
            <div style={{ position: "relative", marginTop: "1.5rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 800,
                  fontSize: "clamp(2.2rem,5vw,3.8rem)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  marginBottom: 0,
                  color: "white",
                }}
              >
                Two systems.
              </h2>
              <span
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.28)",
                  fontSize: "clamp(2rem,4.5vw,3.6rem)",
                  letterSpacing: "-0.03em",
                  display: "block",
                  position: "relative",
                  top: "-0.25em",
                  marginTop: "0.25em",
                }}
              >
                One unified platform.
              </span>
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "1.1rem",
                maxWidth: 540,
                margin: "1.5rem auto 0",
                lineHeight: 1.6,
              }}
            >
              Your storefront and WhatsApp AI work together seamlessly.
            </p>
          </Reveal>
        </div>

        {/* Two pillar cards with connecting bridge */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "2rem",
          alignItems: "stretch",
          position: "relative",
        }}>
          {/* Visual bridge line (hidden on mobile) */}
          <div className="hidden md:block" style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100px",
            height: "2px",
            background: "linear-gradient(90deg, #22C55E, #7C3AED)",
            zIndex: 3,
          }} />

          {/* CARD 1 - Online Storefront */}
          <div style={{ height: "100%" }}>
            <Reveal from="left">
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "2.5rem",
                  padding: "2.5rem",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.3s ease, border-color 0.3s, box-shadow 0.3s",
                  boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)";
                  e.currentTarget.style.boxShadow = "0 30px 60px -20px rgba(34,197,94,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.boxShadow = "0 20px 40px -20px rgba(0,0,0,0.5)";
                }}
              >
                {/* Top gradient line */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "linear-gradient(90deg, #22C55E, transparent)",
                }} />

                <SectionTag color="green">🌐 Online Storefront</SectionTag>
                <h3 style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 800,
                  fontSize: "clamp(1.8rem,3vw,2.4rem)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  marginBottom: "1rem",
                  color: "white",
                }}>
                  Your store, live<br />
                  <span style={{
                    fontFamily: "var(--font-outfit)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.32)",
                  }}>
                    in minutes.
                  </span>
                </h3>
                <p style={{
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.7,
                  marginBottom: "2rem",
                  fontSize: "0.95rem",
                }}>
                  Every account gets a beautiful, shareable storefront — product catalog, cart, and checkout included.
                  No coding, no hosting, zero extra fees.
                </p>

                {/* Feature list */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  marginBottom: "2rem",
                  flex: 1,
                }}>
                  {[
                    "Custom store URL (yourbrand.sellix.io)",
                    "Product grid with images, pricing & descriptions",
                    "Add-to-cart & web checkout built in",
                    "Mobile-first, lightning fast, always online",
                    "Instant WhatsApp notification on every order",
                  ].map((item, i) => (
                    <CheckItem key={i} text={item} />
                  ))}
                </div>

                {/* Mini storefront mockup */}
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "1.5rem",
                  padding: "1.25rem",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#22C55E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                    }}>
                      👗
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>MyStyleStore</div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>store.sellix.io/mystyle</div>
                    </div>
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                  }}>
                    {[
                      { emoji: "👗", name: "Floral Dress", price: "$34" },
                      { emoji: "👟", name: "Sneakers", price: "$59" },
                      { emoji: "👜", name: "Leather Bag", price: "$89" },
                      { emoji: "🕶️", name: "Sunglasses", price: "$24" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: "12px",
                          padding: "0.75rem",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>{item.emoji}</div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#22C55E" }}>{item.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* CARD 2 - WhatsApp AI Agent */}
          <div style={{ height: "100%" }}>
            <Reveal from="right" delay={120}>
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "2.5rem",
                  padding: "2.5rem",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.3s ease, border-color 0.3s, box-shadow 0.3s",
                  boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";
                  e.currentTarget.style.boxShadow = "0 30px 60px -20px rgba(124,58,237,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.boxShadow = "0 20px 40px -20px rgba(0,0,0,0.5)";
                }}
              >
                {/* Top gradient line */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "linear-gradient(90deg, #7C3AED, transparent)",
                }} />

                <SectionTag color="green">🤖 WhatsApp AI Agent</SectionTag>
                <h3 style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 800,
                  fontSize: "clamp(1.8rem,3vw,2.4rem)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  marginBottom: "1rem",
                  color: "white",
                }}>
                  Sales on autopilot,<br />
                  <span style={{
                    fontFamily: "var(--font-outfit)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.32)",
                  }}>
                    24 hours a day.
                  </span>
                </h3>
                <p style={{
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.7,
                  marginBottom: "2rem",
                  fontSize: "0.95rem",
                }}>
                  Your AI agent handles every customer conversation — answers questions, takes orders,
                  sends confirmations, and escalates to you when needed.
                </p>

                {/* Feature list */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  marginBottom: "2rem",
                  flex: 1,
                }}>
                  {[
                    "Instant AI replies around the clock",
                    "Auto order creation from chat conversations",
                    "Handles FAQs, policies & product queries",
                    "Smart escalation with full conversation context",
                    "Order status updates sent automatically",
                  ].map((item, i) => (
                    <CheckItem key={i} text={item} />
                  ))}
                </div>

                {/* Chat mockup */}
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "1.5rem",
                  padding: "1.25rem",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#7C3AED,#22C55E)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}>
                      🤖
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>Sellix AI Agent</div>
                      <div style={{ fontSize: "0.7rem", color: "#22C55E", display: "flex", alignItems: "center", gap: 4 }}>
                        <PulsingDot /> Always online
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <ChatBubble text="What are your opening hours?" type="them" delay={0} />
                    <ChatBubble text="We're open 24/7 — I'm your AI assistant, always here! 🕐 What can I help you order today?" type="bot" delay={100} />
                    <ChatBubble text="I want the blue hoodie, size L 🙏" type="them" delay={200} />
                    <ChatBubble text="✅ <strong>Blue Hoodie (L)</strong> added to cart<br/>$42 · Ships in 2 days" type="bot" delay={300} />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section style={{ padding: "5rem 2rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "2rem", textAlign: "center" }}>
          {STATS.map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div>
                <div style={{
                  fontFamily: "var(--font-outfit)", fontWeight: 400,
                  fontSize: "clamp(2.4rem,4.5vw,3.5rem)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "0.4rem",
                  ...(s.accent ? {
                    background: "linear-gradient(135deg,#22C55E,#86EFAC)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  } : { color: "#fff" }),
                }}>{s.value}</div>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.32)", fontFamily: "var(--font-outfit)", fontWeight: 500 }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesConstellation() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgLinesRef = useRef<SVGGElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; feature: FeatureItem } | null>(null);
  const { ref: sectionRef, visible } = useIntersect(0.1);

  const drawLines = () => {
    const canvas = canvasRef.current;
    const g = svgLinesRef.current;
    if (!canvas || !g) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    g.innerHTML = "";
    CONNECTIONS.forEach(([a, b], idx) => {
      const pa = { x: STAR_POSITIONS[a].x / 100 * w, y: STAR_POSITIONS[a].y / 100 * h };
      const pb = { x: STAR_POSITIONS[b].x / 100 * w, y: STAR_POSITIONS[b].y / 100 * h };
      // Static dashed line
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(pa.x)); line.setAttribute("y1", String(pa.y));
      line.setAttribute("x2", String(pb.x)); line.setAttribute("y2", String(pb.y));
      line.setAttribute("stroke", "rgba(37,211,102,0.1)");
      line.setAttribute("stroke-width", "1");
      line.setAttribute("stroke-dasharray", "4 8");
      g.appendChild(line);
      // Animated travel path
      const pathId = `cp_${idx}`;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("id", pathId);
      path.setAttribute("d", `M${pa.x},${pa.y} L${pb.x},${pb.y}`);
      path.setAttribute("fill", "none");
      g.appendChild(path);
      // Traveling dot
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("r", "2.5");
      dot.setAttribute("fill", "#25D366");
      dot.setAttribute("opacity", "0.65");
      const dur = 3 + (idx % 4) * 1.3;
      const del = (idx * 0.5) % dur;
      dot.innerHTML = `<animateMotion dur="${dur}s" begin="${del}s" repeatCount="indefinite" calcMode="linear"><mpath href="#${pathId}"/></animateMotion>`;
      g.appendChild(dot);
    });
  };

  useEffect(() => {
    drawLines();
    const ro = new ResizeObserver(drawLines);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  const handleStarEnter = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
    setActiveIdx(i);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cr = canvas.getBoundingClientRect();
    const sr = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let tx = sr.left - cr.left + sr.width / 2;
    let ty = sr.top - cr.top + sr.height + 10;
    if (tx + 210 > cr.width) tx -= 210;
    if (ty + 130 > cr.height) ty = sr.top - cr.top - 140;
    setTooltip({ x: Math.max(4, tx), y: ty, feature: FEATURES[i] });
  };

  return (
    <section
      ref={sectionRef}
      style={{
        background: "rgba(255,255,255,0.015)",
        padding: "4rem 1.5rem",
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {/* Ambient glows (unchanged) */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "20%",
          width: 500,
          height: 500,
          background: "radial-gradient(ellipse, rgba(37,211,102,0.06), transparent 70%)",
          pointerEvents: "none",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "15%",
          width: 400,
          height: 400,
          background: "radial-gradient(ellipse, rgba(18,140,126,0.05), transparent 70%)",
          pointerEvents: "none",
          borderRadius: "50%",
        }}
      />

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Heading (unchanged) */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "3.5rem",
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(24px)",
            transition: "all 0.7s ease",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 999,
              background: "rgba(37,211,102,0.07)",
              border: "1px solid rgba(37,211,102,0.15)",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#25D366",
              marginBottom: "1.2rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            🔧 Features
          </div>
          <h2
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              marginBottom: 0,
            }}
          >
            Everything you need.
          </h2>
          <span
            className="serif-italic"
            style={{
              display: "block",
              color: "rgba(255,255,255,0.28)",
              fontSize: "clamp(1.8rem, 4vw, 3.2rem)",
              letterSpacing: "-0.03em",
              marginTop: "0.15em",
            }}
          >
            Nothing you don't.
          </span>
        </div>

        {/* Constellation canvas */}
        <div
          ref={canvasRef}
          style={{
            position: "relative",
            width: "100%",
            height: 540,
            margin: "0 auto",
          }}
        >
          {/* SVG layer (unchanged) */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            {/* Outer ring removed per user request */}
            {/* Inner ring – also a circle */}
            <circle
              cx="50%"
              cy="50%"
              r="19%"
              fill="none"
              stroke="rgba(37,211,102,0.04)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />
            {/* Center glow – kept as a circle for consistency */}
            <radialGradient id="cglow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#25D366" stopOpacity="0.13" />
              <stop offset="100%" stopColor="#25D366" stopOpacity="0" />
            </radialGradient>
            <circle cx="50%" cy="50%" r="23%" fill="url(#cglow)" />

            {/* Background micro-stars (unchanged) */}
            {[
              [8, 12], [92, 18], [95, 70], [85, 88],
              [50, 96], [12, 88], [4, 65], [15, 38],
              [35, 5], [65, 5], [72, 90], [28, 92],
            ].map(([px, py], i) => (
              <circle
                key={i}
                cx={`${px}%`}
                cy={`${py}%`}
                r={1 + (i % 3) * 0.6}
                fill="#25D366"
                opacity={0.12 + (i % 4) * 0.08}
              />
            ))}
            <g ref={svgLinesRef} />
          </svg>

          {/* Center node – perfectly centered, brand name updated */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #2EE872, #128C7E)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.2rem",
              border: "1.5px solid rgba(37,211,102,0.4)",
              boxShadow: "0 0 28px rgba(37,211,102,0.28)",
            }}>💬</div>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "#25D366",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginTop: 10,
              }}
            >
              SELLIXS
            </div>
          </div>

          {/* Star nodes (unchanged) */}
          {FEATURES.map((f, i) => {
            const pos = STAR_POSITIONS[i];
            const isActive = activeIdx === i;
            return (
              <div
                key={i}
                onMouseEnter={(e) => handleStarEnter(e, i)}
                onMouseLeave={() => {
                  setActiveIdx(null);
                  setTooltip(null);
                }}
                style={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) scale(${isActive ? 1.2 : 1})`,
                  transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  zIndex: 20,
                  opacity: visible ? 1 : 0,
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                {/* Inner orb only, outer orbit ring removed */}
                <div
                  style={{
                    width: f.size,
                    height: f.size,
                    borderRadius: "50%",
                    background: isActive
                      ? `radial-gradient(circle at 35% 30%, ${f.color}55, ${f.color}20)`
                      : `radial-gradient(circle at 35% 30%, ${f.color}30, ${f.color}0d)`,
                    border: `1px solid ${f.color}${isActive ? "88" : "40"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: Math.round(f.size! * 0.46) + "px",
                    boxShadow: isActive
                      ? `0 0 20px ${f.color}50, 0 0 40px ${f.color}25`
                      : `0 0 10px ${f.color}20`,
                    transition: "all 0.3s ease",
                  }}
                >
                  {f.icon}
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                    marginTop: 8,
                    textAlign: "center",
                    maxWidth: 76,
                    lineHeight: 1.3,
                    letterSpacing: "0.01em",
                    transition: "color 0.2s",
                  }}
                >
                  {f.title}
                </span>
              </div>
            );
          })}

          {/* Tooltip (unchanged) */}
          {tooltip && (
            <div
              style={{
                position: "absolute",
                left: tooltip.x,
                top: tooltip.y,
                background: "rgba(6,16,10,0.97)",
                border: `1px solid ${tooltip.feature.color}35`,
                borderRadius: 14,
                padding: "14px 16px",
                width: 205,
                pointerEvents: "none",
                zIndex: 100,
                boxShadow: `0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px ${tooltip.feature.color}10`,
                animation: "tooltipIn 0.18s ease",
              }}
            >
              <style>
                {`@keyframes tooltipIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }`}
              </style>
              <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>
                {tooltip.feature.icon}
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                {tooltip.feature.title}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.65,
                }}
              >
                {tooltip.feature.desc}
              </div>
            </div>
          )}
        </div>

        {/* Legend (unchanged) */}
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {LEGEND_ITEMS.map((l) => (
            <div
              key={l.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: l.color,
                  boxShadow: `0 0 6px ${l.color}80`,
                }}
              />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes centerPulse {
          0%,100% { box-shadow: 0 0 0 14px rgba(37,211,102,0.15), 0 0 0 28px rgba(37,211,102,0.1), 0 0 60px rgba(37,211,102,0.45); }
          50%      { box-shadow: 0 0 0 20px rgba(37,211,102,0.2), 0 0 0 40px rgba(37,211,102,0.15), 0 0 90px rgba(37,211,102,0.65); }
        }
      `}</style>
    </section>
  );
}




/* ─── per-card accent colours ─── */

/* ─── META ─── */
const META = [
  { color: "#25D366", bg: "rgba(37,211,102,0.10)", tag: "E-commerce" },
  { color: "#5BC8F5", bg: "rgba(91,200,245,0.10)", tag: "Electronics" },
  { color: "#F5A05B", bg: "rgba(245,160,91,0.10)", tag: "Beauty" },
  { color: "#7EFFC2", bg: "rgba(126,255,194,0.10)", tag: "Restaurant" },
  { color: "#25D366", bg: "rgba(37,211,102,0.10)", tag: "Handmade" },
  { color: "#5BC8F5", bg: "rgba(91,200,245,0.10)", tag: "Fitness" },
  { color: "#F5A05B", bg: "rgba(245,160,91,0.10)", tag: "Restaurant" },
  { color: "#7EFFC2", bg: "rgba(126,255,194,0.10)", tag: "Crafts" },
];

type CardData = { quote: string; author: string; role: string; initials: string };
type Meta = { color: string; bg: string; tag: string };

/* ─── single card ─── */
function Card({ card, meta }: { card: CardData; meta: Meta }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0,
        width: 350,
        background: hov ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? meta.color + "45" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "1.5rem",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.7rem",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transform: hov
          ? "translateY(-10px) rotate(-1.2deg) scale(1.035)"
          : "translateY(0) rotate(0deg) scale(1)",
        transition:
          "transform .4s cubic-bezier(.34,1.56,.64,1), border-color .3s, background .3s, box-shadow .3s",
        boxShadow: hov ? `0 28px 64px rgba(0,0,0,.65), 0 0 0 1px ${meta.color}12` : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg,transparent,${meta.color}35,transparent)`,
        }}
      />
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 10px",
          borderRadius: 999,
          background: meta.bg,
          color: meta.color,
          fontSize: "0.67rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          width: "fit-content",
        }}
      >
        {meta.tag}
      </span>
      <div
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "3.2rem",
          color: meta.color + "28",
          lineHeight: 0.75,
          userSelect: "none",
        }}
      >
        "
      </div>
      <p
        style={{
          fontSize: "0.875rem",
          lineHeight: 1.75,
          color: "rgba(255,255,255,0.58)",
          fontStyle: "italic",
          flex: 1,
          margin: 0,
        }}
      >
        {card.quote}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginTop: "0.25rem" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            flexShrink: 0,
            background: meta.bg,
            border: `1px solid ${meta.color}40`,
            color: meta.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "0.72rem",
          }}
        >
          {card.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: "0.875rem",
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {card.author}
          </div>
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>{card.role}</div>
        </div>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {[...Array(5)].map((_, j) => (
            <span key={j} style={{ color: "#25D366", fontSize: "0.75rem" }}>
              ★
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── one infinite lane – now shows max 4 cards at once ─── */
function Lane({
  cards,
  metas,
  direction,
}: {
  cards: CardData[];
  metas: Meta[];
  direction: "left" | "right";
}) {
  const [paused, setPaused] = useState(false);

  // duplicate for seamless loop
  const doubled = [
    ...cards.map((c, i) => ({ c, m: metas[i % metas.length] })),
    ...cards.map((c, i) => ({ c, m: metas[i % metas.length] })),
  ];

  const animName = direction === "left" ? "marqueeLeft" : "marqueeRight";
  const duration = direction === "left" ? "64s" : "72s"; // slowed down further

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          width: "max-content",
          padding: "0.75rem 0",
          animation: `${animName} ${duration} ease-in-out infinite`, // changed to ease-in-out
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {doubled.map((item, i) => (
          <Card key={i} card={item.c} meta={item.m} />
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  const { ref, visible } = useIntersect(0.1);

  return (
    <section
      ref={ref}
      style={{
        padding: "8rem 0",
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
        background: "rgba(255,255,255,0.012)",
      }}
    >
      {/* Heading */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "4rem",
          padding: "0 1.5rem",
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(24px)",
          transition: "opacity .7s ease, transform .7s ease",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(2rem,4.5vw,3.4rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#fff",
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          Real stores.{" "}
          <span
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              background: "linear-gradient(135deg,#25D366,#7EFFC2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Real results.
          </span>
        </h2>

        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "1rem",
            marginTop: "1.25rem",
          }}
        >
          2,000+ businesses already selling smarter.
        </p>
      </div>

      {/* Static three cards */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "2rem",
          padding: "0 2rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "1.5rem",
            padding: "2rem",
            flex: 1,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p style={{ color: "#fff", fontSize: "1.1rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            "This app transformed our business! Customer engagement skyrocketed."
          </p>
          <div style={{ color: "#25D366", marginBottom: "0.5rem" }}>★★★★★</div>
          <div style={{ color: "#fff", fontWeight: 600 }}>Sarah J.</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>Boutique Bloom</div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "1.5rem",
            padding: "2rem",
            flex: 1,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p style={{ color: "#fff", fontSize: "1.1rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            "Sales increased by 40% within the first month. Highly recommend! Amazing app"
          </p>
          <div style={{ color: "#25D366", marginBottom: "0.5rem" }}>★★★★★</div>
          <div style={{ color: "#fff", fontWeight: 600 }}>Mike T.</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>Tech Haven</div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "1.5rem",
            padding: "2rem",
            flex: 1,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p style={{ color: "#fff", fontSize: "1.1rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            "Incredible ROI and amazing support team. Absolutely essential tool."
          </p>
          <div style={{ color: "#25D366", marginBottom: "0.5rem" }}>★★★★★</div>
          <div style={{ color: "#fff", fontWeight: 600 }}>Elena R.</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>Fashion Forward</div>
        </div>
      </div>
    </section>
  );
}



function AudienceSection() {
  return (
    <section style={{ padding: "5rem 2rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <h2 style={{
            fontFamily: "var(--font-outfit)", fontWeight: 800,
            fontSize: "clamp(1.8rem,4vw,3rem)", letterSpacing: "-0.04em", marginBottom: "0.75rem",
          }}>
            Built for{" "}
            <span style={{
              background: "linear-gradient(135deg,#7C3AED,#22C55E)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>every seller.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "2.5rem", fontSize: "0.95rem" }}>
            Whatever you sell, wherever you sell it.
          </p>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
          {AUDIENCES.map((a, i) => (
            <Reveal key={i} delay={i * 40}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.6rem",
                padding: "0.7rem 1.25rem",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 999, fontSize: "0.875rem", fontWeight: 600, cursor: "default",
                transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1),border-color 0.25s,box-shadow 0.25s,background 0.25s",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.04)";
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)";
                  e.currentTarget.style.background = "rgba(124,58,237,0.07)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.boxShadow = "";
                }}>
                {a}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" style={{ background: "rgba(255,255,255,0.012)", padding: "7rem 2rem", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <Reveal>
            <h2 style={{
              fontFamily: "var(--font-outfit)", fontWeight: 800,
              fontSize: "clamp(2rem,4.5vw,3.4rem)", letterSpacing: "-0.04em",
            }}>
              Common{" "}
              <span style={{ fontFamily: "var(--font-outfit)", fontStyle: "italic", fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>
                questions.
              </span>
            </h2>
          </Reveal>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {FAQS.map((f, i) => (
            <Reveal key={i} delay={i * 40}>
              <div style={{
                background: open === i ? "rgba(124,58,237,0.04)" : "rgba(255,255,255,0.025)",
                border: `1px solid ${open === i ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "1.1rem", overflow: "hidden", transition: "all 0.3s ease",
              }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "1.1rem 1.25rem", background: "transparent", border: "none", color: "#fff",
                    fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "0.875rem",
                    cursor: "pointer", textAlign: "left", gap: "1rem",
                  }}>
                  {f.q}
                  <span style={{
                    fontSize: "1.1rem",
                    color: open === i ? "#22C55E" : "rgba(255,255,255,0.3)",
                    transform: open === i ? "rotate(180deg)" : "none",
                    transition: "transform 0.3s,color 0.3s", flexShrink: 0,
                  }}>▾</span>
                </button>
                <div style={{ maxHeight: open === i ? 200 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
                  <div style={{ padding: "0 1.25rem 1.1rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>{f.a}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── tiny hook: animated counting number ─────────────────────── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return val;
}

/* ── avatar stack ────────────────────────────────────────────── */
const AVATARS = ["#7C3AED", "#A855F7", "#22C55E", "#0EA5E9", "#F59E0B"];
function AvatarStack() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex" }}>
        {AVATARS.map((bg, i) => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: "50%",
            background: bg, border: "2px solid #08070D",
            marginLeft: i === 0 ? 0 : -8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: 700, color: "#fff",
            fontFamily: "var(--font-outfit)",
            zIndex: AVATARS.length - i,
            position: "relative",
          }}>
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      <span style={{
        fontSize: "0.75rem", color: "rgba(255,255,255,0.45)",
        fontFamily: "var(--font-outfit)", fontWeight: 500,
      }}>
        5,000+ businesses
      </span>
    </div>
  );
}

/* ── floating stat badge ─────────────────────────────────────── */
function StatBadge({ icon: Icon, label, value, animVal, style }: {
  icon: any; label: string; value: string; animVal: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      position: "absolute",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.09)",
      backdropFilter: "blur(16px)",
      borderRadius: 16,
      padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 10,
      minWidth: 160,
      ...style,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "rgba(124,58,237,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={16} color="#A855F7" />
      </div>
      <div>
        <div style={{
          fontFamily: "var(--font-outfit)", fontWeight: 800,
          fontSize: "1.05rem", color: "#fff", lineHeight: 1,
          letterSpacing: "-0.02em",
        }}>
          {value.replace(/\d+/, String(animVal))}
        </div>
        <div style={{
          fontSize: "0.7rem", color: "rgba(255,255,255,0.35)",
          fontFamily: "var(--font-outfit)", fontWeight: 500, marginTop: 2,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ── canvas dot-grid background ──────────────────────────────── */
function DotGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let t = 0;

    const draw = () => {
      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      const gap = 32;
      const cols = Math.ceil(W / gap);
      const rows = Math.ceil(H / gap);
      t += 0.008;

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x = c * gap;
          const y = r * gap;
          // ripple from center
          const dx = x - W / 2;
          const dy = y - H / 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const wave = Math.sin(dist * 0.012 - t * 2.5) * 0.5 + 0.5;
          const alpha = wave * 0.22 + 0.04;
          const radius = wave * 1.4 + 0.6;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(124,58,237,${alpha})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas ref={ref} style={{
      position: "absolute", inset: 0, width: "100%", height: "100%",
      pointerEvents: "none",
    }} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export function FinalCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const businesses = useCountUp(5000, 2000, visible);
  const orders = useCountUp(120, 2000, visible);
  const growth = useCountUp(340, 2200, visible);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative", overflow: "hidden",
        background: "#08070D",
        padding: "10rem 2rem",
        isolation: "isolate",
      }}
    >
      {/* ── animated dot grid ── */}
      <DotGrid />

      {/* ── hard top edge beam ── */}
      <div style={{
        position: "absolute", top: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "60%", height: 1,
        background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.6),rgba(34,197,94,0.4),transparent)",
      }} />

      {/* ── radial glow center ── */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 900, height: 500,
        background: "radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, rgba(34,197,94,0.04) 40%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* ── ghosted large word behind everything ── */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-56%)",
        fontFamily: "var(--font-outfit)", fontWeight: 900,
        fontSize: "clamp(8rem,22vw,20rem)",
        letterSpacing: "-0.06em", lineHeight: 1,
        color: "transparent",
        WebkitTextStroke: "1px rgba(124,58,237,0.07)",
        whiteSpace: "nowrap", pointerEvents: "none",
        userSelect: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 1.5s ease",
      }}>
        SELLIX
      </div>

      {/* ── floating stat badges ── */}
      {visible && (
        <>
          <StatBadge
            icon={Users} label="Active stores" value={`${businesses}+`}
            animVal={businesses}
            style={{
              top: "18%", left: "max(2rem, calc(50% - 520px))",
              animation: "cta-floatA 6s ease-in-out infinite",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.8s 0.3s ease",
            }}
          />
          <StatBadge
            icon={ShoppingBag} label="Orders / minute" value={`${orders}k`}
            animVal={orders}
            style={{
              top: "22%", right: "max(2rem, calc(50% - 520px))",
              animation: "cta-floatB 7s ease-in-out infinite",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.8s 0.5s ease",
            }}
          />
          <StatBadge
            icon={TrendingUp} label="Avg revenue growth" value={`${growth}%`}
            animVal={growth}
            style={{
              bottom: "20%", left: "max(2rem, calc(50% - 480px))",
              animation: "cta-floatA 8s ease-in-out infinite reverse",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.8s 0.7s ease",
            }}
          />
        </>
      )}

      {/* ── main content block ── */}
      <div style={{
        position: "relative", zIndex: 2,
        maxWidth: 680, margin: "0 auto",
        textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* status badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px 6px 10px",
          borderRadius: 999,
          background: "rgba(34,197,94,0.07)",
          border: "1px solid rgba(34,197,94,0.18)",
          fontFamily: "var(--font-outfit)", fontSize: "0.75rem",
          fontWeight: 700, color: "#22C55E",
          marginBottom: "2.5rem",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>
          <PulsingDot /> Free to start · No credit card
        </div>

        {/* headline — two-part stagger */}
        <h2 style={{ margin: "0 0 1.5rem", lineHeight: 0.92 }}>
          <span style={{
            display: "block",
            fontFamily: "var(--font-outfit)", fontWeight: 800,
            fontSize: "clamp(3rem, 7vw, 5.5rem)",
            letterSpacing: "-0.055em", color: "#fff",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s 0.15s ease, transform 0.7s 0.15s cubic-bezier(0.16,1,0.3,1)",
          }}>
            Start Selling
          </span>
          <span style={{
            display: "block",
            fontFamily: "var(--font-outfit)", fontWeight: 400,
            fontStyle: "italic",
            fontSize: "clamp(3.2rem, 7.5vw, 5.8rem)",
            letterSpacing: "-0.04em",
            background: "linear-gradient(125deg,#7C3AED 0%,#A855F7 30%,#22C55E 65%,#7C3AED 100%)",
            backgroundSize: "280% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            animation: "sellix-shimmer 5s linear infinite",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s 0.25s ease, transform 0.7s 0.25s cubic-bezier(0.16,1,0.3,1)",
            paddingTop: "1rem",
          }}>
            Smarter Today.
          </span>
        </h2>

        {/* subtext */}
        <p style={{
          color: "rgba(255,255,255,0.42)", fontSize: "1.05rem",
          lineHeight: 1.75, marginBottom: "2.75rem",
          fontFamily: "var(--font-outfit)", fontWeight: 400,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.7s 0.35s ease",
        }}>
          Create your online store and automate WhatsApp sales in minutes.<br />
          Join 5,000+ businesses already selling on Sellix.
        </p>

        {/* CTA area */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.7s 0.45s ease",
        }}>
          {/* main button — split design */}
          <div style={{ display: "flex", alignItems: "stretch", borderRadius: 999, overflow: "hidden" }}>
            {/* left text area */}
            <button
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: btnHover
                  ? "linear-gradient(90deg,#16a34a,#22c55e)"
                  : "#22C55E",
                color: "#08070D",
                fontFamily: "var(--font-outfit)", fontWeight: 800,
                fontSize: "1rem", letterSpacing: "-0.01em",
                padding: "1.05rem 2rem",
                border: "none", cursor: "pointer",
                transition: "background 0.3s, box-shadow 0.3s, transform 0.3s",
                transform: btnHover ? "scale(1.015)" : "scale(1)",
                boxShadow: btnHover
                  ? "0 0 0 8px rgba(34,197,94,0.12), 0 16px 48px rgba(34,197,94,0.45)"
                  : "0 8px 32px rgba(34,197,94,0.3)",
              }}>
              <Zap size={18} fill="#08070D" stroke="#08070D" />
              Create My Store — Free
            </button>

            {/* right arrow pill */}
            <div style={{
              background: btnHover ? "#16a34a" : "#1aaf53",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 1.25rem",
              borderLeft: "1px solid rgba(0,0,0,0.15)",
              cursor: "pointer",
              transition: "background 0.3s",
            }}>
              <ArrowRight size={18} color="#08070D"
                style={{
                  transform: btnHover ? "translateX(3px)" : "translateX(0)",
                  transition: "transform 0.3s ease",
                }} />
            </div>
          </div>

          {/* avatar + trust row */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
            <AvatarStack />
            <p style={{
              margin: 0, fontSize: "0.72rem",
              color: "rgba(255,255,255,0.18)",
              fontFamily: "var(--font-outfit)", fontWeight: 500,
              letterSpacing: "0.03em",
            }}>
              Free forever for early users · No credit card · Cancel anytime
            </p>
          </div>
        </div>

      </div>

      {/* ── bottom edge beam ── */}
      <div style={{
        position: "absolute", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "40%", height: 1,
        background: "linear-gradient(90deg,transparent,rgba(34,197,94,0.3),transparent)",
      }} />

      {/* ── keyframes ── */}
      <style>{`
        @keyframes cta-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes sellix-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 280% center; }
        }
        @keyframes cta-floatA {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes cta-floatB {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   NAV
───────────────────────────────────────────────────────────── */
function Nav({ scrollY }: { scrollY: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const scrolled = scrollY > 40;
  const links = [
    { href: "#product", label: "Product" },
    { href: "#how", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      padding: scrolled ? "0.85rem 2rem" : "1.2rem 2rem",
      transition: "all 0.4s ease",
      ...(scrolled || isOpen ? {
        background: "rgba(8,7,13,0.88)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      } : {}),
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center", // Center navigation links
          gap: "1rem",
          position: "relative", // Needed for absolute positioning of children
          height: "80px" // Ensure the header is tall enough for the larger logo
        }}>

          {/* Logo Container - Absolute positioning keeps it from "affecting others" */}
          <a href="/" style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            position: "absolute",
            left: 0 // Anchors logo to the far left
          }}>
            <img
              src="/logo2.png"
              alt="Sellix Logo"
              style={{
                height: "15rem", // Increased from 40px
                width: "12rem", // Increased from 100px
                objectFit: "contain",
                filter: "drop-shadow(0 0 10px rgba(124,58,237,0.3))"
              }}
            />
          </a>

          {/* Desktop Links - These will stay centered or spaced correctly */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 2 }}>
            {links.map(l => (
              <a key={l.href} href={l.href} style={{
                padding: "0.5rem 1rem", borderRadius: 999,
                fontFamily: "var(--font-outfit)", fontSize: "0.875rem", fontWeight: 500,
                color: "rgba(255,255,255,0.5)", textDecoration: "none",
                transition: "color 0.2s,background 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.background = "transparent"; }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Auth Buttons - Anchored to the right via absolute positioning */}
          <div className="hidden md:flex" style={{
            alignItems: "center",
            gap: "0.75rem",
            position: "absolute",
            right: 0
          }}>
            <a href="/login" style={{
              fontFamily: "var(--font-outfit)", fontSize: "0.875rem", fontWeight: 500,
              color: "rgba(255,255,255,0.4)", textDecoration: "none", padding: "0.5rem 0.75rem",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
              Log in
            </a>
            <button style={{
              background: "#22C55E", color: "#08070D",
              fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: "0.875rem",
              padding: "0.6rem 1.4rem", borderRadius: 999, border: "none", cursor: "pointer",
              transition: "transform 0.2s,box-shadow 0.2s",
            }}
              onClick={() => window.location.href = '/signup'}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(34,197,94,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              Start free →
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center" style={{ position: "absolute", right: 0 }}>
            <button onClick={() => setIsOpen(!isOpen)} style={{
              background: "transparent", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer"
            }}>
              {isOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden" style={{
            display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "1.5rem", paddingBottom: "1rem",
            borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "1rem",
          }}>
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setIsOpen(false)} style={{
                fontFamily: "var(--font-outfit)", fontSize: "1rem", fontWeight: 600,
                color: "rgba(255,255,255,0.8)", textDecoration: "none",
                padding: "0.5rem 0",
              }}>
                {l.label}
              </a>
            ))}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.5rem 0" }} />
            <a href="/login" style={{
              fontFamily: "var(--font-outfit)", fontSize: "1rem", fontWeight: 600,
              color: "rgba(255,255,255,0.8)", textDecoration: "none", padding: "0.5rem 0",
            }}>
              Log in
            </a>
            <button onClick={() => window.location.href = '/signup'} style={{
              background: "#22C55E", color: "#08070D",
              fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: "1rem",
              padding: "0.8rem", borderRadius: 999, border: "none", cursor: "pointer",
              marginTop: "0.5rem", width: "100%",
            }}>
              Start free →
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROOT PAGE
───────────────────────────────────────────────────────────── */
export default function SellixLanding() {
  const scrollY = useScrollY();
  const showSticky = scrollY > 700;

  return (
    <div style={{
      fontFamily: "var(--font-jakarta)",
      background: "#08070D", color: "#fff",
      overflowX: "hidden", position: "relative",
    }}>
      {/* ─ GLOBAL STYLES ─ */}
      <style>{`
        
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#08070D}
        ::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.45);border-radius:3px}

        @keyframes sellix-ping{0%{transform:scale(1);opacity:.8}80%,100%{transform:scale(2.2);opacity:0}}
        @keyframes sellix-float{0%,100%{transform:translateY(0) rotate(0deg)}40%{transform:translateY(-12px) rotate(0.4deg)}70%{transform:translateY(-6px) rotate(-0.3deg)}}
        @keyframes sellix-floatb{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
        @keyframes sellix-shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes sellix-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes sellix-scan{0%{top:-60px}100%{top:110%}}
        @keyframes sellix-blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes sellix-grid{from{background-position:0 0}to{background-position:64px 64px}}
        @keyframes sellix-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
        @keyframes sellix-orb{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(calc(-50% - 40px),calc(-50% + 30px))}}

        @media(max-width:900px){
          .sellix-split{grid-template-columns:1fr !important}
          .sellix-stats{grid-template-columns:repeat(2,1fr) !important}
          .sellix-pricing{grid-template-columns:1fr !important;max-width:400px;margin-left:auto;margin-right:auto}
          .sellix-float-card{display:none !important}
          .sellix-nav-links,.sellix-nav-login{display:none !important}
        }
        @media(max-width:600px){
          .sellix-hero-h1{font-size:2.4rem !important}
        }
      `}</style>

      {/* ─ FIXED ORBS ─ */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-18%", left: "28%", width: 800, height: 800, borderRadius: "50%",
          background: "radial-gradient(ellipse,rgba(124,58,237,0.06) 0%,transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "8%", right: "12%", width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(ellipse,rgba(34,197,94,0.04) 0%,transparent 70%)",
        }} />
      </div>

      <Nav scrollY={scrollY} />
      <HeroSection />
      <MarqueeBar />
      <PainSection />
      <HowItWorksSection />
      <ProductShowcaseSection />
      <StatsBar />
      <FeaturesConstellation />
      <Testimonials />
      {/* <PricingSection /> */}
      <AudienceSection />
      <FAQSection />
      <FinalCTA />

      {/* ─ FOOTER ─ */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        background: "rgba(255,255,255,0.01)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo Section - Replaced gradient div and span with one img tag */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/logo2.png"
            alt="Sellix Logo"
            style={{
              width: "12rem",
              height: "10rem", // Set to 15 as requested (standard for footer height)
              objectFit: "contain",
              filter: "drop-shadow(0 0 8px rgba(124,58,237,0.2))"
            }}
          />
        </div>

        {/* Copyright - Stays in place */}
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.22)" }}>
          © 2025 Sellix. All rights reserved.
        </p>

        {/* Footer Links - Stays in place */}
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" style={{
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.25)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#22C55E")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
              {l}
            </a>
          ))}
        </div>
      </footer>

      {/* ─ STICKY CTA ─ */}
      <div style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        zIndex: 300,
        opacity: showSticky ? 1 : 0,
        pointerEvents: showSticky ? "auto" : "none",
        transition: "opacity 0.4s ease",
      }}>
        <button style={{
          background: "rgba(8,7,13,0.9)", border: "1px solid rgba(124,58,237,0.35)", color: "#fff",
          fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "0.875rem",
          padding: "0.85rem 2rem", borderRadius: 999, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
          backdropFilter: "blur(20px)", whiteSpace: "nowrap",
          transition: "transform 0.25s,box-shadow 0.25s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(124,58,237,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block", boxShadow: "0 0 8px #22C55E" }} />
          Create Your Store Free →
        </button>
      </div>
    </div>
  );
}