"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token in localStorage (cookie is set by API)
      if (data.token) {
        localStorage.setItem("admin_token", data.token);
      }

      // Redirect to admin dashboard
      router.push("/admin");
      
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080C10] relative overflow-hidden">
      {/* Background Effects */}
      <style>{`
        .glass-admin {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(24px);
        }
        .btn-primary-admin {
          background: linear-gradient(135deg, #25D366 0%, #1aab52 100%);
          box-shadow: 0 4px 24px rgba(37,211,102,0.35);
          transition: all 0.25s ease;
        }
        .btn-primary-admin:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 32px rgba(37,211,102,0.5); 
        }
      `}</style>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#25D366]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-4">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#25D366] to-emerald-600 flex items-center justify-center shadow-lg shadow-[#25D366]/30">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Access
          </h1>
          <p className="text-white/60">
            Sign in to manage your platform
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-admin rounded-3xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="text-white/70 mb-2 block text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/20 rounded-xl h-12 pl-12 pr-4 transition-all"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-white/70 mb-2 block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/20 rounded-xl h-12 pl-12 pr-4 transition-all"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-admin text-white rounded-full h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-white/40 text-center">
              🔒 Secure admin access • Only authorized personnel allowed
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-white/40 hover:text-white text-sm transition-colors"
          >
            ← Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
