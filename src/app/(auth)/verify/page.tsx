"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight, Mail, Shield, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [code, setCode] = useState("");

    const email = searchParams.get("email");
    const type = searchParams.get("type"); // "signup" or "login"
    const name = searchParams.get("name");
    const businessName = searchParams.get("businessName");
    const phone = searchParams.get("phone");
    const password = searchParams.get("password");
    const devOtp = searchParams.get("devOtp");

    useEffect(() => {
        if (devOtp) {
            setCode(devOtp);
        }
    }, [devOtp]);

    useEffect(() => {
        if (!email || !type) {
            router.push("/login");
        }
    }, [email, type, router]);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    type,
                    code,
                    name,
                    businessName,
                    phone,
                    password,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                if (type === "signup") {
                    const onboardingUrl = `/dashboard/onboarding?businessName=${encodeURIComponent(businessName || "My Business")}`;
                    login(data.accessToken, data.user, onboardingUrl);
                } else {
                    login(data.accessToken, data.user);
                }
            } else {
                setError(data.error || "Invalid or expired verification code.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-md">
                {/* Form Card */}
                <div className="glass-dark rounded-3xl p-8 relative overflow-hidden">
                    <div className="shimmer absolute inset-0 rounded-3xl pointer-events-none" />
                    <div className="relative z-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-[#22C55E]" />
                        </div>

                        <div className="mb-8">
                            <h2 style={{ fontWeight: 700, letterSpacing: "-0.02em" }} className="text-2xl text-white mb-2">
                                Check your email
                            </h2>
                            {devOtp && (
                                <div className="bg-[#22C55E]/10 text-[#22C55E] text-xs font-semibold px-2 py-1 rounded w-fit mx-auto mb-2 border border-[#22C55E]/20">
                                    DEV MODE: OTP AUTO-FILLED
                                </div>
                            )}
                            <p className="text-white/60">
                                We sent a 6-digit code to <br />
                                <span className="text-white font-medium">{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-6 text-left">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-sm font-medium text-white/70">
                                    Verification Code
                                </Label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="123456"
                                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-2 focus:ring-[#22C55E]/50 focus:border-[#22C55E] transition-all"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                    required
                                    maxLength={6}
                                />
                            </div>

                            {error && (
                                <Alert className="border-red-500/30 bg-red-500/10">
                                    <AlertDescription className="text-red-400 text-left">{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 btn-primary text-white font-semibold rounded-full transition-all duration-200"
                                disabled={loading || code.length !== 6}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                                ) : (
                                    <><ShieldCheck className="mr-2 h-4 w-4" /> Verify Code <ArrowRight className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-sm">
                            <p className="text-white/40">
                                Didn&apos;t receive the code?{" "}
                                <button className="text-[#22C55E] hover:text-[#1ea855] font-medium transition-colors">
                                    Resend
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link href={type === "signup" ? "/signup" : "/login"} className="text-sm text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1">
                        ← Back to {type === "signup" ? "Signup" : "Login"}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <div style={{ background: "#08070D" }} className="min-h-screen text-white flex font-[var(--font-jakarta)]">
            <style>{`
        
        .glass-dark { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(24px); }
        .btn-primary { background: #22C55E; color: #08070D; font-family: var(--font-outfit); font-weight: 800; border-radius: 999px; transition: transform 0.25s, box-shadow 0.25s; }
        .btn-primary:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(34,197,94,0.4); }
        .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); background-size: 200% 100%; animation: shimmer 3s linear infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

            <div className="w-full flex">
                <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" /></div>}>
                    <VerifyContent />
                </Suspense>
            </div>
        </div>
    );
}
