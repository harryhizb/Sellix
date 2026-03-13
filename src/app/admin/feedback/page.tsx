"use client";

import { useState, useEffect } from "react";
import { 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Mail,
  Phone,
  Building
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Feedback {
  _id: string;
  rating: number;
  comment?: string;
  businessId: any;
  customerId: any;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  isFlagged: boolean;
  messageType: 'support' | 'bug' | 'feature' | 'feedback';
  subject?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  averageRating: number;
  totalFeedback: number;
  totalBusinesses: number;
}

const messageTypeIcons = {
  support: HelpCircle,
  bug: Bug,
  feature: Lightbulb,
  feedback: MessageSquare,
};

const messageTypeLabels = {
  support: "Support Request",
  bug: "Bug Report",
  feature: "Feature Request",
  feedback: "Customer Feedback",
};

const messageTypeColors = {
  support: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  bug: "bg-red-500/10 text-red-400 border-red-500/20",
  feature: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  feedback: "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20",
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  
  // Filters
  const [messageTypeFilter, setMessageTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected feedback for detail view
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [pagination.page, messageTypeFilter, statusFilter]);

  async function fetchFeedback() {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(messageTypeFilter && { messageType: messageTypeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      
      const res = await fetch(`/api/admin/feedback?${params}`);
      if (!res.ok) throw new Error("Failed to fetch feedback");
      const data = await res.json();
      setFeedback(data.feedback || []);
      setPagination(data.pagination);
      
      // Also fetch stats
      const statsRes = await fetch("/api/admin/feedback?stats=true");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.platformStats);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(feedbackId: string, newStatus: string) {
    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/feedback?id=${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      // Update local state
      setFeedback(prev => prev.map(f => 
        f._id === feedbackId ? { ...f, status: newStatus } : f
      ));
      if (selectedFeedback?._id === feedbackId) {
        setSelectedFeedback(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  async function handleAdminNotesSave() {
    if (!selectedFeedback) return;
    
    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/feedback?id=${selectedFeedback._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      
      if (!res.ok) throw new Error("Failed to save notes");
      
      alert("Notes saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save notes");
    } finally {
      setUpdating(false);
    }
  }

  function openDetailModal(feedback: Feedback) {
    setSelectedFeedback(feedback);
    setAdminNotes(""); // You could load existing notes here
    setIsDetailModalOpen(true);
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "reviewed": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "resolved": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "flagged": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Feedback & Support Messages</h1>
        <p className="text-white/60">Manage all customer feedback, support requests, bug reports, and feature suggestions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="admin-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Total Messages</p>
                  <p className="text-3xl font-bold text-white">{stats.totalFeedback}</p>
                </div>
                <MessageSquare className="w-12 h-12 text-[#25D366] opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="admin-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Average Rating</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.averageRating.toFixed(1)} ★
                  </p>
                </div>
                <Star className="w-12 h-12 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="admin-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Businesses</p>
                  <p className="text-3xl font-bold text-white">{stats.totalBusinesses}</p>
                </div>
                <Building className="w-12 h-12 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="admin-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-white">
                    {feedback.filter(f => f.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-12 h-12 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="admin-card">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <Label className="text-white/70 mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Search by name, email, or comment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/[0.02] border-white/[0.06] text-white"
                />
              </div>
            </div>

            {/* Message Type Filter */}
            <div className="w-[200px]">
              <Label className="text-white/70 mb-2 block">Message Type</Label>
              <Select value={messageTypeFilter || "all"} onValueChange={(value) => setMessageTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="bg-white/[0.02] border-white/[0.06] text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-[200px]">
              <Label className="text-white/70 mb-2 block">Status</Label>
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="bg-white/[0.02] border-white/[0.06] text-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(messageTypeFilter || statusFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setMessageTypeFilter("");
                  setStatusFilter("");
                }}
                className="border-white/[0.06] text-white/60 hover:text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>All Messages ({pagination.total})</span>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="border-white/[0.06] text-white/60 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-white/60">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="border-white/[0.06] text-white/60 hover:text-white disabled:opacity-30"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366]"></div>
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No feedback messages found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => {
                const Icon = messageTypeIcons[item.messageType] || MessageSquare;
                return (
                  <div
                    key={item._id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer"
                    onClick={() => openDetailModal(item)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={cn("border", messageTypeColors[item.messageType])}>
                            <Icon className="w-3 h-3 mr-1" />
                            {messageTypeLabels[item.messageType]}
                          </Badge>
                          <Badge className={cn("border", getStatusBadgeColor(item.status))}>
                            {item.status}
                          </Badge>
                          {item.isFlagged && (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Flagged
                            </Badge>
                          )}
                          {item.rating && (
                            <div className="flex items-center gap-1 text-yellow-400 text-sm">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{item.rating}</span>
                            </div>
                          )}
                        </div>
                        
                        {item.subject && (
                          <h3 className="text-white font-medium mb-1">{item.subject}</h3>
                        )}
                        
                        <p className="text-white/60 text-sm line-clamp-2 mb-2">
                          {item.comment}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-white/40">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{item.customerName || "Anonymous"}</span>
                          </div>
                          {item.customerEmail && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{item.customerEmail}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Eye className="w-5 h-5 text-white/30 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedFeedback && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-3">
                {(() => {
                  const Icon = messageTypeIcons[selectedFeedback.messageType] || MessageSquare;
                  return <Icon className="w-6 h-6" />;
                })()}
                {messageTypeLabels[selectedFeedback.messageType]}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              {/* Status & Actions */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <Badge className={cn("border", getStatusBadgeColor(selectedFeedback.status))}>
                    {selectedFeedback.status}
                  </Badge>
                  {selectedFeedback.rating && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium">{selectedFeedback.rating}/5</span>
                    </div>
                  )}
                </div>
                
                <Select
                  value={selectedFeedback.status}
                  onValueChange={(value) => handleStatusUpdate(selectedFeedback._id, value)}
                  disabled={updating}
                >
                  <SelectTrigger className="w-[180px] bg-white/[0.02] border-white/[0.06]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-white/60" />
                    <h4 className="text-sm font-medium text-white/80">Customer</h4>
                  </div>
                  <p className="text-white">{selectedFeedback.customerName || "Anonymous"}</p>
                </div>
                
                {selectedFeedback.customerEmail && (
                  <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-white/60" />
                      <h4 className="text-sm font-medium text-white/80">Email</h4>
                    </div>
                    <p className="text-white">{selectedFeedback.customerEmail}</p>
                  </div>
                )}
                
                {selectedFeedback.customerPhone && (
                  <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-white/60" />
                      <h4 className="text-sm font-medium text-white/80">Phone</h4>
                    </div>
                    <p className="text-white">{selectedFeedback.customerPhone}</p>
                  </div>
                )}
                
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-white/60" />
                    <h4 className="text-sm font-medium text-white/80">Submitted</h4>
                  </div>
                  <p className="text-white">
                    {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Message Content */}
              {selectedFeedback.subject && (
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-2">Subject</h4>
                  <p className="text-white">{selectedFeedback.subject}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2">Message</h4>
                <p className="text-white whitespace-pre-wrap">{selectedFeedback.comment}</p>
              </div>

              {/* Admin Notes */}
              <div>
                <Label className="text-white/70 mb-2 block">Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  className="min-h-[100px] bg-white/[0.02] border-white/[0.06] text-white"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
                className="border-white/[0.06] text-white/60 hover:text-white"
              >
                Close
              </Button>
              <Button
                onClick={handleAdminNotesSave}
                disabled={updating}
                className="btn-primary"
              >
                {updating ? "Saving..." : "Save Notes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
