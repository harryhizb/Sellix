"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, ArrowRight, Shield, MessageSquare, TrendingUp, Quote, Eye, EyeOff, Sparkles, Store, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [method, setMethod] = useState<"password" | "otp">("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        // We will pass the id_token to our backend if we used standard flow, 
        // but with useGoogleLogin (implicit) we can't easily get id_token safely.
        // Wait, react-oauth/google useGoogleLogin standard returns access_token.
        // To verify on backend safely, we should use the credential response from <GoogleLogin> 
        // OR we can pass access_token and let backend fetch userinfo?
        // Actually, @react-oauth/google's `useGoogleLogin` returns an `access_token`. 
        // But our backend API `/api/auth/google` explicitly uses `client.verifyIdToken({ idToken: credential })`.
        // So we MUST use `useGoogleLogin({ flow: 'auth-code' })` or just pass the access_token and change the backend?
        // No! `@react-oauth/google` provides `useGoogleLogin` that can return an auth code, or implicit token.
        // Let's change the pattern: Instead of `verifyIdToken`, we can fetch user API from backend or just send the access_token.

        // Let's just send the `access_token` to the backend, and the backend verifies it by calling the Google API.
        // Or better yet, we can use the credential from a <GoogleLogin> button.
        // Let's stay with access_token and change backend, or we can just send it as 'credential' if backend supports it.
        // Wait, the backend currently checks verifyIdToken! I'll change the backend to fetch userinfo with the access_token.

        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: tokenResponse.access_token,
            type: "login"
          }),
        });

        const data = await res.json();
        if (res.ok) {
          login(data.accessToken, data.user);
        } else {
          setError(data.error || "Google login failed");
        }
      } catch (err) {
        setError("An error occurred during Google sign-in.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google sign-in was canceled or failed."),
  });

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.accessToken, data.user);
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, type: "login" }),
      });

      const data = await res.json();

      if (res.ok) {
        const params = new URLSearchParams({ email: formData.email, type: "login" });
        if (data.devOtp) {
          params.append("devOtp", data.devOtp);
        }
        router.push(`/verify?${params.toString()}`);
      } else {
        setError(data.error || "Failed to send code");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ background: "#080C10" }}
      className="min-h-screen text-white flex font-['Sora','DM_Sans',sans-serif]"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px); }
        .glass-dark { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(24px); }
        .grid-bg { background-image: linear-gradient(rgba(37,211,102,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,211,102,0.04) 1px, transparent 1px); background-size: 60px 60px; }
        .noise::after { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events: none; border-radius: inherit; }
        .btn-primary { background: linear-gradient(135deg, #25D366 0%, #1aab52 100%); box-shadow: 0 4px 24px rgba(37,211,102,0.35); transition: all 0.25s ease; }
        .btn-primary:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(37,211,102,0.5); }
        .btn-primary:active { transform: translateY(0); }
        .btn-google { background: white; color: #3c4043; border: 1px solid #dadce0; transition: all 0.2s ease; box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15); }
        .btn-google:hover { background: #f8f9fa; box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15); }
        .number-gradient { background: linear-gradient(135deg, #25D366, #7EFFC2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .tag-pill { background: linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.05)); border: 1px solid rgba(37,211,102,0.25); }
        .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); background-size: 200% 100%; animation: shimmer 3s linear infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-[#05080D] grid-bg noise">
        <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: "900px", height: "600px", background: "radial-gradient(ellipse at center, rgba(37,211,102,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "0", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(ellipse at center, rgba(37,211,102,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-20 w-full">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center btn-primary">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span style={{ fontWeight: 700, letterSpacing: "-0.02em" }} className="text-xl text-white">Sellix</span>
          </Link>

          <div className="space-y-8 max-w-lg">
            <div className="tag-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#25D366]">
              <Sparkles className="w-4 h-4" />
              Now with GPT-4 powered conversations
            </div>
            <h1 style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }} className="text-white">
              Your WhatsApp <span className="number-gradient">sales team</span>
            </h1>
            <div className="space-y-4">
              <div className="glass rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#25D366]/10 border border-[#25D366]/20">
                  <TrendingUp className="w-6 h-6 text-[#25D366]" />
                </div>
                <div>
                  <p className="text-white font-semibold">3x Revenue Growth</p>
                  <p className="text-white/40 text-sm">Average increase in sales</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <Quote className="w-8 h-8 text-[#25D366]/30 mb-3" />
            <p className="text-white/60 mb-4 leading-relaxed text-sm">
              &ldquo;Setup took literally 5 minutes. Now our customers get instant responses at any hour. Best investment we've made for our business.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#1aab52] flex items-center justify-center text-white font-semibold text-sm">MR</div>
              <div>
                <p className="text-white font-medium text-sm">Michael Rodriguez</p>
                <p className="text-white/40 text-xs">Founder, TechGadgets Store</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span style={{ fontWeight: 700, letterSpacing: "-0.02em" }} className="text-xl text-white">Sellix</span>
          </div>

          <div className="glass-dark rounded-3xl p-8 relative overflow-hidden">
            <div className="shimmer absolute inset-0 rounded-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="mb-8">
                <h2 style={{ fontWeight: 700, letterSpacing: "-0.02em" }} className="text-2xl text-white mb-2">Welcome back</h2>
                <p className="text-white/40">Sign in to manage your store</p>
              </div>

              {/* Login Method Tabs */}
              <div className="flex p-1 mb-6 bg-white/5 rounded-xl">
                <button
                  onClick={() => setMethod("password")}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", method === "password" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}
                >
                  Password
                </button>
                <button
                  onClick={() => setMethod("otp")}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", method === "otp" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}
                >
                  Email Code
                </button>
              </div>

              <form onSubmit={method === "password" ? handlePasswordSubmit : handleOtpSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/70">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {method === "password" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-white/70">Password</Label>
                      <button type="button" onClick={() => setMethod("otp")} className="text-xs text-[#25D366] hover:text-[#1ea855] font-medium transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366] transition-all"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <Alert className="border-red-500/30 bg-red-500/10 mb-4">
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-12 btn-primary text-white font-semibold rounded-full transition-all duration-200" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {method === "password" ? "Signing in..." : "Sending code..."}</>
                  ) : (
                    <>{method === "password" ? "Sign In" : "Send Login Code"} <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs"><span className="px-2 bg-[#080C10] text-white/40">or</span></div>
              </div>

              {/* Google Auth Button */}
              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                className="w-full h-12 btn-google flex items-center justify-center gap-3 rounded-full font-medium"
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-white/40 mt-6">
                Don't have an account? <Link href="/signup" className="text-white font-semibold hover:text-[#25D366] transition-colors">Create one</Link>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
            <Shield className="h-3.5 w-3.5" />
            <span>Your WhatsApp sessions are encrypted and secure</span>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}