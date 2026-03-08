// nextjs/src/app/dashboard/faqs/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Search,
  Filter,
  MessageSquare,
  User,
  Bot,
  Zap,
  Copy,
  Star,
  TrendingUp,
  Clock,
  FileText,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type FAQType = 'ai' | 'takeover' | 'both';
type FAQCategory = 'general' | 'orders' | 'shipping' | 'returns' | 'support' | 'takeover';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  type: FAQType;
  category: FAQCategory;
  usageCount: number;
  lastUsed?: Date;
  isActive: boolean;
  tags?: string[];
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TakeoverTemplate {
  id: string;
  scenario: string;
  response: string;
  category: 'complaint' | 'order' | 'technical' | 'escalation' | 'resolution';
  usageCount: number;
}

export default function FAQPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("ai");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);

  // Form State
  const [newItem, setNewItem] = useState({
    question: "",
    answer: "",
    type: "ai" as FAQType,
    category: "general" as FAQCategory,
    tags: [] as string[],
    tagInput: ""
  });

  const fetchFAQs = useCallback(async () => {
    try {
      const res = await fetch(`/api/faqs?businessId=${user?.businessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.faqs) {
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error("Failed to fetch FAQs", error);
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, [token, user?.businessId]);

  // Fetch FAQs
  useEffect(() => {
    if (token && user?.businessId) {
      fetchFAQs();
    }
  }, [token, user?.businessId, fetchFAQs]);

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesStatus = showInactive ? true : faq.isActive;
    const matchesType = activeTab === "all" || faq.type === activeTab ||
      (activeTab === "takeover" && faq.type === "takeover") ||
      (activeTab === "ai" && (faq.type === "ai" || faq.type === "both"));

    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  });

  // Create new FAQ
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newItem,
          businessId: user?.businessId,
          tags: newItem.tags
        }),
      });

      if (res.ok) {
        toast.success("FAQ added successfully");
        setNewItem({
          question: "",
          answer: "",
          type: "ai",
          category: "general",
          tags: [],
          tagInput: ""
        });
        setIsCreating(false);
        fetchFAQs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add FAQ");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add FAQ");
    }
  }

  // Delete FAQ
  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await fetch(`/api/faqs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("FAQ deleted successfully");
      fetchFAQs();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete FAQ");
    }
  }

  // Toggle FAQ status
  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      await fetch(`/api/faqs/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      toast.success(`FAQ ${!currentStatus ? "activated" : "deactivated"}`);
      fetchFAQs();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update FAQ status");
    }
  }

  // Add tag
  const handleAddTag = () => {
    if (newItem.tagInput.trim() && !newItem.tags.includes(newItem.tagInput.trim())) {
      setNewItem({
        ...newItem,
        tags: [...newItem.tags, newItem.tagInput.trim()],
        tagInput: ""
      });
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setNewItem({
      ...newItem,
      tags: newItem.tags.filter(t => t !== tag)
    });
  };

  // Quick templates for AI FAQs
  const aiTemplates = [
    {
      name: "🕒 Business Hours",
      question: "What are your business hours?",
      answer: "We are open Monday to Friday, 9 AM to 6 PM. Saturdays 10 AM to 4 PM. Closed on Sundays and public holidays.",
      category: "general" as FAQCategory
    },
    {
      name: "📍 Location",
      question: "Where are you located?",
      answer: "Our store is located at [Your Business Address]. We also offer nationwide shipping. You can find us on Google Maps: [Google Maps Link]",
      category: "general" as FAQCategory
    },
    {
      name: "📦 Delivery Time",
      question: "How long does delivery take?",
      answer: "Standard delivery takes 3-5 business days. Express delivery (1-2 days) is available for an additional fee. You'll receive tracking information once your order ships.",
      category: "shipping" as FAQCategory
    },
    {
      name: "🔄 Return Policy",
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for unused items in original packaging. Refunds are processed within 5-7 business days after we receive the return. Some items may be exempt (see product page for details).",
      category: "returns" as FAQCategory
    },
    {
      name: "💰 Payment Methods",
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, UPI, and bank transfers. All payments are securely processed.",
      category: "orders" as FAQCategory
    }
  ];

  // Templates for Takeover Scenarios
  const takeoverTemplates = [
    {
      name: "⚠️ Handling Complaints",
      question: "Customer complaint about product quality",
      answer: "I understand your concern about the product quality. Let me check the details and see how we can make this right. Could you share photos of the issue? We stand behind our products and will ensure you're satisfied.",
      category: "takeover" as FAQCategory,
      type: "takeover" as FAQType,
      tags: ["complaint", "quality", "resolution"]
    },
    {
      name: "🚚 Delivery Issue",
      question: "Customer reports late/missing delivery",
      answer: "I apologize for the delivery delay. Let me check the tracking status immediately and get back to you within 30 minutes. We'll ensure your order reaches you as soon as possible or arrange for a replacement if needed.",
      category: "takeover" as FAQCategory,
      type: "takeover" as FAQType,
      tags: ["delivery", "delay", "tracking"]
    },
    {
      name: "💳 Refund Request",
      question: "Customer requests refund for cancelled order",
      answer: "I'll process your refund right away. The amount will be refunded to your original payment method within 5-7 business days. You'll receive a confirmation email with the refund details. Is there anything else I can assist you with?",
      category: "takeover" as FAQCategory,
      type: "takeover" as FAQType,
      tags: ["refund", "payment", "cancellation"]
    },
    {
      name: "🔧 Technical Support",
      question: "Customer needs technical assistance",
      answer: "I'll connect you with our technical specialist who can help resolve this issue. In the meantime, could you share the product model number and describe what happens when you try to use it? This will help us provide faster assistance.",
      category: "takeover" as FAQCategory,
      type: "takeover" as FAQType,
      tags: ["technical", "support", "escalation"]
    },
    {
      name: "🎯 Upsell Opportunity",
      question: "Customer interested in premium product",
      answer: "Great choice! The premium version includes [features] and comes with [benefits]. I can arrange a special upgrade price for you. Would you like me to share more details or proceed with the upgrade?",
      category: "takeover" as FAQCategory,
      type: "takeover" as FAQType,
      tags: ["upsell", "premium", "upgrade"]
    }
  ];

  // Statistics
  const stats = {
    total: faqs.length,
    active: faqs.filter(f => f.isActive).length,
    aiOnly: faqs.filter(f => f.type === 'ai').length,
    takeoverOnly: faqs.filter(f => f.type === 'takeover').length,
    both: faqs.filter(f => f.type === 'both').length,
    mostUsed: faqs.length > 0 ? [...faqs].sort((a, b) => b.usageCount - a.usageCount)[0] : null
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Knowledge Base & Takeover Scripts</h2>
          <p className="text-muted-foreground mt-1">
            Manage responses for both AI assistant and human agents during takeovers
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="w-4 h-4 mr-2" /> Add Knowledge
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="orders">Orders</option>
            <option value="shipping">Shipping</option>
            <option value="returns">Returns</option>
            <option value="support">Support</option>
            <option value="takeover">Takeover</option>
          </select>
        </div>

        {!isCreating && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Start Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {aiTemplates.map((template, index) => (
                  <Button
                    key={`ai-${index}`}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewItem({
                        question: template.question,
                        answer: template.answer,
                        type: "ai",
                        category: template.category,
                        tags: [],
                        tagInput: ""
                      });
                      setIsCreating(true);
                    }}
                    className="text-left h-auto py-2 px-3"
                  >
                    <div className="text-xs font-medium">{template.name}</div>
                  </Button>
                ))}
                {takeoverTemplates.map((template, index) => (
                  <Button
                    key={`takeover-${index}`}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewItem({
                        question: template.question,
                        answer: template.answer,
                        type: template.type,
                        category: template.category,
                        tags: template.tags,
                        tagInput: ""
                      });
                      setIsCreating(true);
                    }}
                    className="text-left h-auto py-2 px-3 border-red-200 bg-red-50 hover:bg-red-100"
                  >
                    <div className="text-xs font-medium">{template.name}</div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isCreating && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>
                {newItem.type === "takeover" ? "Add Takeover Script" : "Add AI Knowledge"}
              </CardTitle>
              <CardDescription>
                {newItem.type === "takeover"
                  ? "Scripts used by human agents during conversation takeovers"
                  : "Knowledge used by AI assistant to answer customer questions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      value={newItem.type}
                      onChange={(e) => setNewItem({ ...newItem, type: e.target.value as FAQType })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="ai">AI Assistant Only</option>
                      <option value="takeover">Takeover Script Only</option>
                      <option value="both">Both AI & Human</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value as FAQCategory })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="general">General</option>
                      <option value="orders">Orders</option>
                      <option value="shipping">Shipping</option>
                      <option value="returns">Returns</option>
                      <option value="support">Support</option>
                      <option value="takeover">Takeover Scenarios</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    {newItem.type === "takeover" ? "Scenario/Trigger" : "Customer Question"}
                  </Label>
                  <Input
                    placeholder={
                      newItem.type === "takeover"
                        ? "e.g., Customer complaint about product quality"
                        : "e.g., What is your return policy?"
                    }
                    value={newItem.question}
                    onChange={e => setNewItem({ ...newItem, question: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    {newItem.type === "takeover" ? "Human Agent Response" : "AI Response"}
                  </Label>
                  <textarea
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder={
                      newItem.type === "takeover"
                        ? "Professional response for human agents to use..."
                        : "Detailed, helpful answer for AI to provide..."
                    }
                    value={newItem.answer}
                    onChange={e => setNewItem({ ...newItem, answer: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags (for better search)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag and press Enter"
                      value={newItem.tagInput}
                      onChange={e => setNewItem({ ...newItem, tagInput: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  {newItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newItem.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {newItem.type === "takeover" ? "Add Takeover Script" : "Add to Knowledge Base"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsCreating(false);
                      setNewItem({
                        question: "",
                        answer: "",
                        type: "ai",
                        category: "general",
                        tags: [],
                        tagInput: ""
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>
                  {filteredFaqs.length} of {faqs.length} entries
                  {stats.mostUsed && ` • Most used: "${stats.mostUsed.question.substring(0, 30)}..." (${stats.mostUsed.usageCount} times)`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading knowledge base...
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No knowledge found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try different search terms or clear filters"
                    : "Add your first FAQ or takeover script to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <Card key={faq._id} className={!faq.isActive ? "opacity-60" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            {faq.type === "ai" && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Bot className="w-3 h-3" /> AI
                              </Badge>
                            )}
                            {faq.type === "takeover" && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <User className="w-3 h-3" /> Takeover
                              </Badge>
                            )}
                            {faq.type === "both" && (
                              <Badge className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Both
                              </Badge>
                            )}

                            <Badge variant="secondary">{faq.category}</Badge>

                            {!faq.isActive && (
                              <Badge variant="outline">Inactive</Badge>
                            )}

                            <div className="flex-1" />

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {faq.usageCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  <span>{faq.usageCount} uses</span>
                                </div>
                              )}

                              {faq.lastUsed && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Last used: {new Date(faq.lastUsed).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-base mb-1">{faq.question}</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {faq.answer}
                            </p>
                          </div>

                          {faq.tags && faq.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {faq.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-block px-2 py-1 text-xs bg-muted rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(faq.answer);
                              toast.success("Response copied to clipboard");
                            }}
                            title="Copy response"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(faq._id, faq.isActive)}
                            title={faq.isActive ? "Deactivate" : "Activate"}
                          >
                            {faq.isActive ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(faq._id)}
                            title="Delete"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Integration with Takeover System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Bot className="w-4 h-4" /> AI Assistant
              </h4>
              <p className="text-sm text-muted-foreground">
                AI uses &quot;AI Only&quot; and &quot;Both&quot; type FAQs to answer customer questions automatically.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" /> Human Agents
              </h4>
              <p className="text-sm text-muted-foreground">
                During takeover, agents see &quot;Takeover Only&quot; and &quot;Both&quot; type scripts as quick responses.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Usage Tracking
              </h4>
              <p className="text-sm text-muted-foreground">
                System tracks how often each FAQ is used to help you optimize your knowledge base.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}