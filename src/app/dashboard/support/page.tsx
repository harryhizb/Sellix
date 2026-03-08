"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LifeBuoy, 
  MessageCircle, 
  Send, 
  CheckCircle,
  Mail,
  Bug,
  Lightbulb,
  HelpCircle,
  Star,
  ThumbsUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const feedbackTypes = [
  { id: "support", label: "Need Help", icon: HelpCircle, desc: "Get assistance with your account" },
  { id: "bug", label: "Report Bug", icon: Bug, desc: "Report an issue or glitch" },
  { id: "feature", label: "Feature Request", icon: Lightbulb, desc: "Suggest a new feature" },
  { id: "feedback", label: "Rate Platform", icon: Star, desc: "Rate & review Sellix" },
];

export default function SupportPage() {
  const { user, token } = useAuth();
  const [selectedType, setSelectedType] = useState("support");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    email: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      // If it's a rating/feedback for the platform owner
      if (selectedType === "feedback" && rating > 0) {
        const res = await fetch("/api/admin/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            rating,
            comment: formData.message,
            customerName: user?.name || formData.email,
            customerEmail: formData.email,
            customerPhone: "", // You can add phone to user model if needed
            businessId: user?.businessId,
            source: "web",
            messageType: "feedback"
          })
        });
        
        if (!res.ok) throw new Error("Failed to submit feedback");
      } else {
        // For support tickets/bugs/features
        const res = await fetch("/api/admin/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            rating: selectedType === "feedback" ? rating : 5,
            comment: `${formData.subject}\n\n${formData.message}`,
            customerName: user?.name || formData.email,
            customerEmail: formData.email,
            customerPhone: "",
            businessId: user?.businessId,
            source: "web",
            messageType: selectedType as 'support' | 'bug' | 'feature',
            subject: formData.subject
          })
        });
        
        if (!res.ok) throw new Error("Failed to submit");
      }
      
      setSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center mx-auto mb-6 green-glow">
            <CheckCircle className="w-10 h-10 text-[#25D366]" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Message Sent!</h2>
          <p className="text-white/60 mb-8">
            Thank you for reaching out. We&apos;ll get back to you within 24 hours.
          </p>
          <Button 
            onClick={() => {
              setSubmitted(false);
              setFormData({ subject: "", message: "", email: "" });
            }}
            className="btn-primary text-white rounded-full px-8"
          >
            Send Another Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full tag-pill mb-4">
          {selectedType === "feedback" ? (
            <>
              <Star className="w-4 h-4 text-[#25D366]" />
              <span className="text-sm font-medium text-[#25D366]">Customer Feedback</span>
            </>
          ) : (
            <>
              <LifeBuoy className="w-4 h-4 text-[#25D366]" />
              <span className="text-sm font-medium text-[#25D366]">Support Center</span>
            </>
          )}
        </div>
        <h1 className="text-3xl font-semibold text-white mb-3 tracking-tight">
          {selectedType === "feedback" ? "Share Your Feedback" : "How can we help?"}
        </h1>
        <p className="text-white/60">
          {selectedType === "feedback" 
            ? "Help us improve by sharing your experience and rating our platform"
            : "Send us a message and we&apos;ll respond as soon as possible"
          }
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-8">
        {/* Form */}
        <div className="glass rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Type */}
            <div className="grid grid-cols-2 gap-3">
              {feedbackTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    selectedType === type.id
                      ? "border-[#25D366]/50 bg-[#25D366]/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  )}
                >
                  <type.icon className={cn(
                    "w-5 h-5 mb-2",
                    selectedType === type.id ? "text-[#25D366]" : "text-white/50"
                  )} />
                  <p className={cn(
                    "font-medium text-sm",
                    selectedType === type.id ? "text-white" : "text-white/70"
                  )}>
                    {type.label}
                  </p>
                  <p className="text-xs text-white/40 mt-1">{type.desc}</p>
                </button>
              ))}
            </div>

            {/* Rating Stars (only for feedback type) */}
            {selectedType === "feedback" && (
              <div>
                <Label className="text-white/70 mb-2 block">Your Rating</Label>
                <Card className="bg-white/[0.02] border-white/[0.06]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              "w-10 h-10 transition-all",
                              star <= (hoveredRating || rating)
                                ? "fill-[#25D366] text-[#25D366]"
                                : "fill-white/[0.05] text-white/30"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-center text-sm mt-3 text-white/60">
                        {rating === 1 && "Poor"}
                        {rating === 2 && "Fair"}
                        {rating === 3 && "Good"}
                        {rating === 4 && "Very Good"}
                        {rating === 5 && "Excellent"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Subject */}
            <div>
              <Label className="text-white/70 mb-2 block">Subject</Label>
              <Input
                placeholder="What's this about?"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-12"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label className="text-white/70 mb-2 block">Your Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-12 pl-11"
                  required
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <Label className="text-white/70 mb-2 block">Message</Label>
              <Textarea
                placeholder="Describe your issue or feedback in detail..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl min-h-[150px] resize-none"
                required
              />
            </div>

            {/* Submit */}
            <Button 
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-white rounded-full h-12 font-medium"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <div className="space-y-3">
              <a 
                href="#" 
                className="flex items-center gap-3 text-white/60 hover:text-[#25D366] transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Documentation</span>
              </a>
              <a 
                href="#" 
                className="flex items-center gap-3 text-white/60 hover:text-[#25D366] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Community Forum</span>
              </a>
              <a 
                href="#" 
                className="flex items-center gap-3 text-white/60 hover:text-[#25D366] transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email Us</span>
              </a>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-2">Response Time</h3>
            <p className="text-sm text-white/60">
              We typically respond within 24 hours during business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
