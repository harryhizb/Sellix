"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import {
  Check, ChevronLeft, ChevronRight,
  Store, ShieldCheck, Sparkles,
  Truck, CreditCard, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "business", title: "Store", description: "Your store details" },
  { id: "policies", title: "Policies", description: "Set your rules" },
  { id: "review", title: "Launch", description: "Go live!" }
];

// Simplified for ecommerce only
const AI_TONES = [
  { id: "friendly", label: "Friendly & Casual", desc: "Warm, approachable, uses emojis" },
  { id: "professional", label: "Professional", desc: "Formal, efficient, business-focused" },
  { id: "minimal", label: "Minimal", desc: "Short, direct, no fluff" },
];

function OnboardingContent() {
  const { token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(true);

  const [data, setData] = useState({
    businessName: searchParams.get("businessName") || user?.name || "",
    contactPhone: "",
    address: "",
    description: "",
    currency: "PKR", // Default to PKR for Pakistani market
    tone: "friendly",
    policies: {
      delivery: { enabled: true, timeframe: "2-3 business days", charges: "Free over 1000 rupees", description: "" },
      refund: { enabled: true, durationDays: 7, description: "" },
      payment: { methods: ["cod"], instructions: "" },
    },
    settings: {
      autoConfirmOrders: false,
      maxProductsToShow: 10,
    }
  });

  const nextStep = () => {
    if (currentStep === 0 && !data.contactPhone.trim()) {
      return;
    }
    setAnimateIn(false);
    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      setAnimateIn(true);
    }, 200);
  };

  const prevStep = () => {
    setAnimateIn(false);
    setTimeout(() => {
      setCurrentStep(prev => Math.max(prev - 1, 0));
      setAnimateIn(true);
    }, 200);
  };

  async function handleFinish() {
    setLoading(true);
    try {
      const payload = {
        name: data.businessName,
        contactPhone: data.contactPhone,
        address: data.address,
        description: data.description,
        currency: data.currency,
        tone: data.tone,
        policies: data.policies,
        settings: {
          ...data.settings,
          currency: data.currency,
        },
        capabilities: {
          supportsProducts: true,
          supportsServices: false,
          supportsBooking: false,
          supportsCart: true,
          supportsInformation: false,
        },
        category: "ecommerce",
        onboardingComplete: true,
      };

      const res = await fetch("/api/business/onboarding", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Sidebar - Progress */}
      <div className="hidden lg:flex w-80 flex-col border-r border-slate-800 bg-slate-900/50 p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Sellix</span>
        </div>

        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Setup Progress</h2>
          <div className="space-y-1">
            {STEPS.map((step, i) => (
              <div key={i} className={cn(
                "flex items-center gap-4 p-4 rounded-xl transition-all",
                i === currentStep ? "bg-slate-800" : i < currentStep ? "opacity-70" : "opacity-40"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                  i < currentStep ? "bg-[#25D366] text-white" :
                    i === currentStep ? "bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30" :
                      "bg-slate-800 text-slate-500"
                )}>
                  {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div>
                  <p className={cn("font-medium", i === currentStep ? "text-white" : "text-slate-400")}>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#25D366]" />
            <span>Your data is secure</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Sellix</span>
          </div>
          <div className="text-sm text-slate-500">
            Step {currentStep + 1} of {STEPS.length}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-12">
          <div className={cn(
            "max-w-2xl mx-auto transition-all duration-300",
            animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            {currentStep === 0 && <BusinessStep data={data} setData={setData} />}
            {currentStep === 1 && <PoliciesStep data={data} setData={setData} />}
            {currentStep === 2 && <ReviewStep data={data} onFinish={handleFinish} loading={loading} />}
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-slate-800 p-6 lg:p-8 bg-slate-900/50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="text-slate-400 hover:text-white disabled:opacity-0"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <div key={i} className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i === currentStep ? "bg-[#25D366]" : i < currentStep ? "bg-[#25D366]/50" : "bg-slate-700"
                )} />
              ))}
            </div>

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={currentStep === 0 && !data.contactPhone.trim()}
                className="bg-[#25D366] hover:bg-[#1ea855] text-white"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={loading}
                className="bg-[#25D366] hover:bg-[#1ea855] text-white"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Launch Store
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessStep({ data, setData }: { data: any, setData: any }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Set up your store</h1>
        <p className="text-slate-400">Configure how your AI assistant will handle sales</p>
      </div>

      {/* Store Name */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <Label className="text-white">Store Name *</Label>
        <Input
          value={data.businessName}
          onChange={(e) => setData({ ...data, businessName: e.target.value })}
          className="mt-2 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-[#25D366]"
        />
        <p className="text-xs text-slate-500 mt-2">The public name of your store</p>
      </div>

      {/* WhatsApp Number for Notifications */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <Label className="text-white flex items-center gap-2">
          WhatsApp Number for Notifications *
          <span className="text-xs px-2 py-0.5 bg-[#25D366]/20 text-[#25D366] rounded-full">Important</span>
        </Label>
        <Input
          placeholder="+92 300 1234567"
          value={data.contactPhone}
          onChange={e => setData({ ...data, contactPhone: e.target.value })}
          className="mt-2 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-[#25D366]"
        />
        <p className="text-xs text-slate-400 mt-2">
          This WhatsApp number will receive all order notifications and customer messages.
        </p>
      </div>

      {/* Store Address */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <Label className="text-white">Store Address</Label>
        <Input
          placeholder="e.g., Shop 5, Main Market, Abbottabad"
          value={data.address}
          onChange={e => setData({ ...data, address: e.target.value })}
          className="mt-2 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-[#25D366]"
        />
        <p className="text-xs text-slate-500 mt-2">
          Shown to customers when they request your location or contact info.
        </p>
      </div>

      {/* Store Description */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <Label className="text-white">Store Description</Label>
        <Input
          placeholder="e.g., Your go-to shop for premium clothing in Abbottabad"
          value={data.description}
          onChange={e => setData({ ...data, description: e.target.value })}
          className="mt-2 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-[#25D366]"
        />
        <p className="text-xs text-slate-500 mt-2">
          A short description of your store that the AI will share with customers.
        </p>
      </div>

      {/* Currency Selection */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <Label className="text-white flex items-center gap-2">
          Store Currency *
          <span className="text-xs px-2 py-0.5 bg-[#25D366]/20 text-[#25D366] rounded-full">Important</span>
        </Label>
        <Select
          value={data.currency}
          onValueChange={(currency) => setData({ ...data, currency })}
        >
          <SelectTrigger className="mt-2 bg-slate-950 border-slate-700 text-white">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PKR">PKR — Pakistani Rupee</SelectItem>
            <SelectItem value="USD">USD — US Dollar</SelectItem>
            <SelectItem value="EUR">EUR — Euro</SelectItem>
            <SelectItem value="GBP">GBP — British Pound</SelectItem>
            <SelectItem value="AED">AED — UAE Dirham</SelectItem>
            <SelectItem value="INR">INR — Indian Rupee</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-2">
          Used for all product prices, order totals, and WhatsApp message templates.
        </p>
      </div>

      {/* AI Tone */}
      <div>
        <Label className="text-white mb-4 block">AI Assistant Tone</Label>
        <div className="space-y-3">
          {AI_TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setData({ ...data, tone: tone.id })}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                data.tone === tone.id
                  ? "border-[#25D366] bg-[#25D366]/5"
                  : "border-slate-800 bg-slate-900 hover:border-slate-700"
              )}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">{tone.label}</h3>
                <p className="text-sm text-slate-500">{tone.desc}</p>
              </div>
              {data.tone === tone.id && (
                <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PoliciesStep({ data, setData }: { data: any, setData: any }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Business policies</h1>
        <p className="text-slate-400">The AI will communicate these to your customers</p>
      </div>

      <div className="space-y-4">
        {/* Delivery */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Delivery</h3>
                <p className="text-sm text-slate-500">Shipping and delivery info</p>
              </div>
            </div>
            <Switch
              checked={data.policies.delivery.enabled}
              onCheckedChange={(checked) => setData({
                ...data,
                policies: { ...data.policies, delivery: { ...data.policies.delivery, enabled: checked } }
              })}
              className="data-[state=checked]:bg-[#25D366]"
            />
          </div>
          {data.policies.delivery.enabled && (
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div>
                <Label className="text-sm text-slate-400">Delivery Time</Label>
                <Input
                  value={data.policies.delivery.timeframe}
                  onChange={e => setData({
                    ...data,
                    policies: { ...data.policies, delivery: { ...data.policies.delivery, timeframe: e.target.value } }
                  })}
                  className="mt-2 bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-400">Delivery Charges</Label>
                <Input
                  placeholder="e.g., Free over 500 rupees"
                  value={data.policies.delivery.charges}
                  onChange={e => setData({
                    ...data,
                    policies: { ...data.policies, delivery: { ...data.policies.delivery, charges: e.target.value } }
                  })}
                  className="mt-2 bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm text-slate-400">Delivery Policy Description</Label>
                <textarea
                  placeholder="e.g., We deliver to all major cities within 2-3 business days. Free delivery on orders over 1000 PKR."
                  value={data.policies.delivery.description}
                  onChange={e => setData({
                    ...data,
                    policies: { ...data.policies, delivery: { ...data.policies.delivery, description: e.target.value } }
                  })}
                  rows={3}
                  className="mt-2 w-full bg-slate-950 border border-slate-700 text-white rounded-md px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#25D366] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Refund */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Returns</h3>
                <p className="text-sm text-slate-500">Return and refund terms</p>
              </div>
            </div>
            <Switch
              checked={data.policies.refund.enabled}
              onCheckedChange={(checked) => setData({
                ...data,
                policies: { ...data.policies, refund: { ...data.policies.refund, enabled: checked } }
              })}
              className="data-[state=checked]:bg-[#25D366]"
            />
          </div>
          {data.policies.refund.enabled && (
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div>
                <Label className="text-sm text-slate-400">Refund Window (days)</Label>
                <Input
                  type="number"
                  value={data.policies.refund.durationDays}
                  onChange={e => setData({
                    ...data,
                    policies: { ...data.policies, refund: { ...data.policies.refund, durationDays: parseInt(e.target.value) } }
                  })}
                  className="mt-2 w-32 bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-400">Refund Policy Description</Label>
                <textarea
                  placeholder="e.g., Items can be returned within 7 days of delivery in original condition."
                  value={data.policies.refund.description}
                  onChange={e => setData({
                    ...data,
                    policies: { ...data.policies, refund: { ...data.policies.refund, description: e.target.value } }
                  })}
                  rows={3}
                  className="mt-2 w-full bg-slate-950 border border-slate-700 text-white rounded-md px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#25D366] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Payment Methods</h3>
              <p className="text-sm text-slate-500">How customers can pay</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
            {[
              { label: "Cash on Delivery", value: "cod" },
              { label: "Bank Transfer", value: "bank" },
              { label: "Card", value: "card" },
              { label: "Digital/UPI", value: "digital" },
            ].map((method) => (
              <button
                key={method.value}
                onClick={() => {
                  const methods = data.policies.payment.methods.includes(method.value)
                    ? data.policies.payment.methods.filter((m: string) => m !== method.value)
                    : [...data.policies.payment.methods, method.value];
                  setData({
                    ...data,
                    policies: { ...data.policies, payment: { ...data.policies.payment, methods } }
                  });
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  data.policies.payment.methods.includes(method.value)
                    ? "bg-[#25D366] text-white"
                    : "bg-slate-950 text-slate-400 hover:text-white"
                )}
              >
                {method.label}
              </button>
            ))}
          </div>
          <div className="pt-4">
            <Label className="text-sm text-slate-400">Payment Instructions</Label>
            <textarea
              placeholder="e.g., For bank transfers, send to Account# 12345 (Bank Al-Habib). Share screenshot after payment."
              value={data.policies.payment.instructions}
              onChange={e => setData({
                ...data,
                policies: { ...data.policies, payment: { ...data.policies.payment, instructions: e.target.value } }
              })}
              rows={3}
              className="mt-2 w-full bg-slate-950 border border-slate-700 text-white rounded-md px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#25D366] resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ data, onFinish, loading }: { data: any, onFinish: () => void, loading: boolean }) {
  const tone = AI_TONES.find(t => t.id === data.tone);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Ready to launch! 🚀</h1>
        <p className="text-slate-400">Review your configuration before going live</p>
      </div>

      <div className="space-y-4">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Store Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Name</span>
              <span className="text-white font-medium">{data.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">WhatsApp</span>
              <span className="text-white font-medium">{data.contactPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Currency</span>
              <span className="text-white font-medium">{data.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AI Tone</span>
              <span className="text-white font-medium">{tone?.label}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-[#25D366]/10 to-emerald-500/10 border border-[#25D366]/20 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">What happens next?</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#25D366]" />
                  Connect your WhatsApp number
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#25D366]" />
                  Add your products
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#25D366]" />
                  Start receiving orders automatically
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
