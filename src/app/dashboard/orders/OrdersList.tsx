"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle, XCircle, Clock, Package, Truck, Home,
  Download, RefreshCw, Eye, Search, Filter, ShoppingBag,
  TrendingUp,

} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { withErrorBoundary } from "@/components/shared/ErrorBoundary";

interface StatusConfig { [key: string]: { color: string; label: string; }; }
interface OrderWithSummary extends Order { summary?: string; }
interface Order {
  _id: string; orderNumber?: string; type?: 'order' | 'booking';
  customerId?: { name?: string; phone?: string; _id: string; };
  customerInfo?: { name?: string; phone?: string; };
  businessId: string; status: string; totalAmount: number; currency: string; source?: string;
  createdAt: string; items: Array<{ name: string; quantity: number; price: number; color?: string; size?: string; attributes?: any }>;
  deliveryDetails?: { address: string; contact: string; city?: string; instructions?: string; };
  bookingDetails?: { preferredDate?: string; preferredTime?: string; guestCount?: number; };
  deliveryTracking?: { trackingNumber: string; carrier: string; }; isPaused?: boolean;
}
interface Pagination { page: number; limit: number; total: number; totalPages: number; }
interface OrdersListProps {
  initialOrders: Order[]; initialStatistics: any; initialPagination: Pagination; statusConfig: StatusConfig;
}

const StatusBadge = React.memo(({ status, statusConfig }: { status: string; statusConfig: StatusConfig }) => {
  const safeStatus = (status || "PENDING").toUpperCase();
  const config = statusConfig[safeStatus] || statusConfig["PENDING"] || { color: 'text-white border-white', label: safeStatus };
  const getIcon = (st: string) => {
    switch (st) {
      case "PENDING": return Clock;
      case "CONFIRMED": return CheckCircle;
      case "PROCESSING": return Package;
      case "SHIPPED": return Truck;
      case "DELIVERED": return Home;
      case "CANCELLED": return XCircle;
      default: return Clock;
    }
  };
  const Icon = getIcon(safeStatus);
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border", config.color)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

const OrderCard = React.memo(({
  order, statusConfig, onApprove, onReject, onViewSummary
}: {
  order: Order; statusConfig: StatusConfig;
  onApprove: (id: string) => void;
  onReject: (order: Order) => void;
  onViewSummary: (id: string) => void;
}) => {
  const customerName = order.customerInfo?.name || order.customerId?.name || "Guest";
  const customerPhone = order.customerInfo?.phone || order.customerId?.phone || order.deliveryDetails?.contact || "No Phone Info";
  const isWebOrder = order.source === "web";

  return (
    <div className="glass rounded-2xl p-6 card-hover mb-6 relative overflow-hidden shadow-lg border border-slate-800/60">
      {/* Decorative top border based on status */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-1",
        order.status === "PENDING" ? "bg-amber-500" :
        order.status === "CONFIRMED" ? "bg-emerald-500" :
        order.status === "DELIVERED" ? "bg-purple-500" : "bg-white/10"
      )} />

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xl font-bold text-white font-mono">#{order.orderNumber || order._id.slice(-6)}</span>
            <StatusBadge status={order.status} statusConfig={statusConfig} />
            {isWebOrder ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-400 uppercase tracking-widest border border-blue-500/30">
                🌐 Web Store
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-widest border border-emerald-500/30">
                💬 WhatsApp
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Customer Details</p>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white/90">{customerName}</span>
                <span className="text-white/30">•</span>
                <span className="text-white/70 font-mono text-sm">{customerPhone}</span>
              </div>
            </div>
            
            <div className="sm:text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Order Date</p>
              <span className="text-white/70 text-sm">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="md:text-right w-full md:w-auto bg-white/[0.03] p-4 rounded-xl border border-white/[0.06] flex md:flex-col justify-between items-center md:items-end">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1 md:text-right">Total Amount</p>
            <p className="text-3xl font-bold text-white font-mono tracking-tight text-emerald-400">
              <span className="text-sm text-emerald-500/70 mr-1">{order.currency}</span>
              {order.totalAmount.toLocaleString()}
            </p>
          </div>
          <p className="text-xs font-medium text-white/50 mt-2 bg-white/5 px-2 py-1 rounded-md">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold">Order Items</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {order.items.map((item, idx) => {
            const variantText = item.attributes?.variant || [item.color, item.size].filter(Boolean).join(", ");
            return (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                    {item.quantity}x
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="text-sm font-medium text-white/90 truncate block">{item.name}</span>
                    {variantText && (
                      <p className="text-[11px] text-white/50 truncate">Variant: {variantText}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-white/80 font-mono shrink-0">
                  {order.currency} {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {order.deliveryDetails && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-transparent border border-blue-500/10 mb-6 flex items-start gap-3">
          <Truck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] text-blue-400/70 uppercase tracking-wider font-bold mb-1">Delivery Info</p>
            <p className="text-sm text-white/80 leading-relaxed">
              {order.deliveryDetails.address}
              {order.deliveryDetails.city ? `, ${order.deliveryDetails.city}` : ''}
            </p>
            {order.deliveryDetails.instructions && (
              <p className="text-xs text-white/50 mt-1 italic">Note: {order.deliveryDetails.instructions}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-white/[0.05]">
        <Button size="sm" variant="outline" onClick={() => onViewSummary(order._id)} className="h-9 px-4 border-white/[0.1] text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all">
          <Eye className="w-4 h-4 mr-2" /> View Details
        </Button>

        {order.status?.toUpperCase() === "PENDING" && (
          <>
            <Button
              size="sm"
              onClick={() => onApprove(order._id)}
              className="h-9 px-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg shadow-lg shadow-emerald-500/20 transition-all font-semibold"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Accept Order
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(order)}
              className="h-9 px-4 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-lg transition-all"
            >
              <XCircle className="w-4 h-4 mr-2" /> Reject
            </Button>
          </>
        )}

        {order.status?.toUpperCase() === "CONFIRMED" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(order)}
            className="h-9 px-4 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-lg transition-all"
          >
            <XCircle className="w-4 h-4 mr-2" /> Cancel Order
          </Button>
        )}
      </div>
    </div>
  );
});
OrderCard.displayName = "OrderCard";

function OrdersList({ initialOrders, initialStatistics, initialPagination, statusConfig }: OrdersListProps) {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const [selectedOrder, setSelectedOrder] = useState<OrderWithSummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const fetchOrdersParams = useMemo(() => new URLSearchParams({
    page: pagination.page.toString(),
    limit: pagination.limit.toString(),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(typeFilter !== "all" && { type: typeFilter }),
    ...(searchQuery && { search: searchQuery })
  }).toString(), [pagination.page, pagination.limit, statusFilter, typeFilter, searchQuery]);

  // React Query Fetch Data
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['orders', token, fetchOrdersParams],
    queryFn: async () => {
      const res = await fetch(`/api/orders?${fetchOrdersParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 15000, // Poll every 15 seconds to auto-refresh new orders
    initialData: () => {
      if (initialOrders && initialOrders.length > 0 && fetchOrdersParams.includes(`page=${initialPagination.page}`)) {
        return { orders: initialOrders, statistics: initialStatistics, pagination: initialPagination };
      }
      return undefined;
    }
  });

  const orders = useMemo(() => data?.orders ?? [], [data?.orders]);
  const statistics = data?.statistics || initialStatistics;
  const currentPagination = data?.pagination || pagination;

  // React Virtual
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useWindowVirtualizer({
    count: orders.length,
    estimateSize: () => (typeof window !== 'undefined' && window.innerWidth < 640 ? 450 : 350),
    overscan: 5,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (searchQuery) params.set("search", searchQuery);
    params.set("page", currentPagination.page.toString());
    router.push(`/dashboard/orders?${params.toString()}`, { scroll: false });
  }, [statusFilter, typeFilter, searchQuery, currentPagination.page, router]);

  // Mutations for Optimistic Updates
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string, status: string, note?: string }) => {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, note })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsStatusDialogOpen(false);
      setNewStatus("");
      setStatusNote("");
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string, note: string }) => {
      const res = await fetch(`/api/orders/${id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note })
      });
      if (!res.ok) throw new Error("Failed to confirm");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error("Failed to cancel");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
    }
  });

  const getOrderSummary = async (orderId: string) => {
    if (!token) return null;
    try {
      const res = await fetch(`/api/orders/${orderId}/summary?type=owner`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      return resData.success ? resData.summary : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const exportOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/orders?limit=1000`, { headers: { Authorization: `Bearer ${token}` } });
      const resData = await res.json();
      if (resData.orders) {
        const headers = ["Order Number", "Customer", "Phone", "Status", "Total", "Created At", "Items"];
        const rows = resData.orders.map((o: Order) => [
          o.orderNumber || o._id.slice(-6), o.customerId?.name || "N/A", o.customerId?.phone || "N/A",
          o.status, `${o.currency} ${o.totalAmount}`, new Date(o.createdAt).toLocaleDateString(),
          o.items.map((i) => `${i.quantity}x ${i.name}`).join("; ")
        ]);
        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); window.URL.revokeObjectURL(url);
      }
    } catch (e) { }
  };

  const pendingCount = useMemo(() => orders.filter((o: Order) => o.status === "PENDING").length, [orders]);
  const deliveredCount = useMemo(() => orders.filter((o: Order) => o.status === "DELIVERED").length, [orders]);

  if (isLoading && !isRefetching && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 glass rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-96 glass rounded-2xl animate-pulse" />
      </div>
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Orders</h1>
          <p className="mt-1 text-white/50 text-sm">Manage and track customer orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching} className="border-white/[0.08] text-white/70 hover:bg-white/5 rounded-full">
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefetching && 'animate-spin')} /> Refresh
          </Button>
          <Button onClick={exportOrders} className="btn-primary text-white rounded-full">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          label="Total Orders"
          value={currentPagination.total.toString()}
          icon={ShoppingBag}
        />
        <StatCard
          label="Pending"
          value={pendingCount.toString()}
          icon={Clock}
          alert={pendingCount > 0}
        />
        <StatCard
          label="Delivered"
          value={deliveredCount.toString()}
          icon={CheckCircle}
          trend={12}
        />
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input 
              placeholder="Search orders..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-11 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl focus:border-[#25D366]/50" 
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-12 bg-white/[0.04] border-white/[0.08] text-white rounded-xl">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="glass-dark border-white/[0.06]">
                <SelectItem value="all" className="text-white/70">All Statuses</SelectItem>
                {Object.keys(statusConfig).map(status => (
                  <SelectItem key={status} value={status} className="text-white/70">
                    {statusConfig[status]?.label || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-12 bg-white/[0.04] border-white/[0.08] text-white rounded-xl">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="glass-dark border-white/[0.06]">
                <SelectItem value="all" className="text-white/70">All Types</SelectItem>
                <SelectItem value="order" className="text-white/70">Orders</SelectItem>
                <SelectItem value="booking" className="text-white/70">Bookings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div
        ref={parentRef}
        className="relative w-full overflow-visible"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {orders.length === 0 ? (
          <EmptyState />
        ) : (
          virtualizer.getVirtualItems().map((virtualRow) => {
            const order = orders[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full px-4 md:px-0 pb-4"
                style={{
                  transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                <OrderCard
                  order={order}
                  statusConfig={statusConfig}
                  onApprove={(id) => {
                    const deliveryTime = prompt("Enter estimated delivery time (e.g., 2 days, 24 hours):");
                    if (deliveryTime) {
                      confirmMutation.mutate({ id, note: `Estimated Delivery: ${deliveryTime}` });
                    }
                  }}
                  onReject={(order) => { setSelectedOrder(order); setIsRejectDialogOpen(true); }}
                  onViewSummary={async (id) => {
                    const summary = await getOrderSummary(id);
                    if (summary) { setSelectedOrder({ ...order, summary }); setIsSummaryOpen(true); }
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      {currentPagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <Button variant="outline" size="sm" onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={currentPagination.page === 1} className="border-white/[0.08] text-white/70 hover:bg-white/5 rounded-full">
            Previous
          </Button>
          <span className="text-sm font-medium text-white/50 px-4 py-2 rounded-full glass">
            Page {currentPagination.page} of {currentPagination.totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={currentPagination.page === currentPagination.totalPages} className="border-white/[0.08] text-white/70 hover:bg-white/5 rounded-full">
            Next
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="glass-dark border-white/[0.06] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#25D366]" />
              Order Summary
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Order #{selectedOrder?.orderNumber || selectedOrder?._id?.slice(-6) || "N/A"}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {selectedOrder?.summary ? (
              <div className="space-y-4">
                {/* Formatted Summary Display */}
                <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 rounded-xl border border-white/[0.08]">
                  <div className="prose prose-invert max-w-none">
                    {selectedOrder?.summary?.split('\n').map((line: string, idx: number) => {
                      // Check if line is a section header
                      if (line.startsWith('###') || line.startsWith('**')) {
                        return (
                          <h4 key={idx} className="text-[#25D366] font-semibold mt-4 mb-2 text-base">
                            {line.replace(/[#*]/g, '')}
                          </h4>
                        );
                      }
                      // Check if line is a bullet point
                      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                        return (
                          <div key={idx} className="flex items-start gap-2 my-1.5 ml-2">
                            <span className="text-[#25D366] mt-1">•</span>
                            <span className="text-white/80 text-sm flex-1">{line.replace(/^[•\-]\s*/, '')}</span>
                          </div>
                        );
                      }
                      // Check if line contains order details (key: value pattern)
                      if (line.includes(':') && !line.startsWith(' ')) {
                        const [key, ...valueParts] = line.split(':');
                        const value = valueParts.join(':');
                        return (
                          <div key={idx} className="flex justify-between py-1.5 border-b border-white/[0.06] last:border-0">
                            <span className="text-white/50 text-sm">{key.trim()}</span>
                            <span className="text-white font-medium text-sm text-right">{value.trim()}</span>
                          </div>
                        );
                      }
                      // Regular text line
                      if (line.trim()) {
                        return (
                          <p key={idx} className="text-white/80 text-sm my-2 leading-relaxed">
                            {line}
                          </p>
                        );
                      }
                      // Empty line - add spacing
                      return <div key={idx} className="h-3" />;
                    })}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1">Total Amount</p>
                    <p className="text-lg font-bold text-white font-mono">
                      {selectedOrder?.currency} {selectedOrder?.totalAmount}
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1">Items</p>
                    <p className="text-lg font-bold text-white">{selectedOrder.items.length}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1">Customer</p>
                    <p className="text-sm font-medium text-white">{selectedOrder.customerId?.name || 'N/A'}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-xs text-white/50 mb-1">Status</p>
                    <StatusBadge status={selectedOrder.status} statusConfig={statusConfig} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-white/50">
                <RefreshCw className="w-8 h-8 animate-spin mb-3" />
                <p>Loading summary...</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSummaryOpen(false)}
              className="border-white/[0.08] text-white/70 hover:bg-white/5 rounded-full"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder?.summary) {
                  navigator.clipboard.writeText(selectedOrder.summary);
                  alert("Summary copied to clipboard!");
                }
              }}
              className="btn-primary text-white rounded-full"
            >
              Copy Summary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="glass-dark border-white/[0.06]">
          <DialogHeader><DialogTitle className="text-white">Update Order Status</DialogTitle><DialogDescription className="text-white/50">Update status for Order #{selectedOrder?.orderNumber}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-white/50">Change status to: <span className="font-bold text-[#25D366]">{newStatus}</span></p>
            <div>
              <Label htmlFor="statusNote" className="text-white/70 mb-2 block">Note to Customer (Optional)</Label>
              <Input id="statusNote" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="e.g. Your order is on the way!" className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} className="border-white/[0.08] text-white/70 hover:bg-white/5 rounded-full">Cancel</Button>
            <Button onClick={() => updateStatusMutation.mutate({ id: selectedOrder?._id || "", status: newStatus, note: statusNote })} disabled={updateStatusMutation.isPending} className="btn-primary text-white rounded-full">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="glass-dark border-white/[0.06]">
          <DialogHeader><DialogTitle className="text-red-400">Reject Order</DialogTitle><DialogDescription className="text-white/50">Provide a reason for rejection. This will be sent to the customer.</DialogDescription></DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="text-white/70 mb-2 block">Rejection Reason</Label>
            <Input id="reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. Out of stock..." className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} className="border-white/[0.08] text-white/70 hover:bg-white/5 rounded-full">Cancel</Button>
            <Button onClick={() => cancelMutation.mutate({ id: selectedOrder?._id || "", reason: rejectionReason })} disabled={cancelMutation.isPending} className="bg-red-500 hover:bg-red-600 text-white rounded-full">Reject Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, alert }: { label: string; value: string; icon: any; trend?: number; alert?: boolean; }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", alert ? "bg-amber-500/10" : "bg-white/5")}>
          <Icon className={cn("w-5 h-5", alert ? "text-amber-400" : "text-white/60")} />
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs text-[#25D366]"><TrendingUp className="w-3 h-3" />{trend}%</div>
        )}
      </div>
      <p className={cn("text-2xl font-bold font-mono", alert ? "text-amber-400" : "text-white")}>{value}</p>
      <p className="text-xs text-white/50 mt-1">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 glass rounded-2xl">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
        <ShoppingBag className="w-8 h-8 text-white/30" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No orders found</h3>
      <p className="text-white/50 text-sm max-w-sm mx-auto">Orders will appear here once customers start purchasing.</p>
    </div>
  );
}

export default withErrorBoundary(OrdersList);
