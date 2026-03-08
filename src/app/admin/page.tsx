"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Wifi, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  AlertCircle,
  Activity,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlatformStats {
  totalBusinesses: number;
  activeConnections: number;
  totalProducts: number;
  totalOrders: number;
  ordersLast24h: number;
  escalatedCount: number;
  feedbackAverage: number;
  feedbackTotal: number;
}

interface SystemHealth {
  whatsappApiStatus: "healthy" | "degraded" | "down";
  errorRate: string;
  serverUptime: number;
  lastChecked: Date;
}

interface DailyOrder {
  date: string;
  count: number;
  revenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [dailyOrders, setDailyOrders] = useState<DailyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  async function fetchPlatformStats() {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      
      const data = await res.json();
      setStats(data.stats);
      setSystemHealth(data.systemHealth);
      setDailyOrders(data.trends.dailyOrders);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
    } finally {
      setLoading(false);
    }
  }

  // Fetch additional product statistics if needed
  async function fetchProductStats() {
    try {
      const res = await fetch("/api/admin/products/stats?token=admin_token");
      if (res.ok) {
        const productData = await res.json();
        // Update stats with accurate product count if different
        if (productData.totalProducts !== stats?.totalProducts) {
          setStats(prev => prev ? { ...prev, totalProducts: productData.totalProducts } : null);
        }
      }
    } catch (error) {
      console.error("Error fetching product stats:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Platform Overview</h1>
        <p className="text-white/60">Real-time analytics and system health monitoring</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Businesses */}
        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Total Businesses
            </CardTitle>
            <Building2 className="w-5 h-5 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.totalBusinesses || 0}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Wifi className="w-3 h-3 text-[#25D366]" />
              <span className="text-[#25D366]">
                {stats?.activeConnections || 0} active connections
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Total Products
            </CardTitle>
            <Activity className="w-5 h-5 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.totalProducts || 0}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3 h-3 text-purple-400" />
              <span className="text-white/60">
                Across all businesses
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Total Orders
            </CardTitle>
            <ShoppingCart className="w-5 h-5 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.totalOrders || 0}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-3 h-3 text-[#25D366]" />
              <span className="text-white/60">
                {stats?.ordersLast24h || 0} in last 24h
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Escalated Cases */}
        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Escalated to Human
            </CardTitle>
            <Users className="w-5 h-5 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.escalatedCount || 0}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="w-3 h-3 text-orange-400" />
              <span className="text-orange-400">
                Requires attention
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Rating */}
        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Average Rating
            </CardTitle>
            <Activity className="w-5 h-5 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.feedbackAverage ? stats.feedbackAverage.toFixed(1) : "0.0"} ★
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/60">
                {stats?.feedbackTotal || 0} reviews
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Order Trend */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* System Health */}
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#25D366]" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  systemHealth?.whatsappApiStatus === "healthy" ? "bg-[#25D366]" :
                  systemHealth?.whatsappApiStatus === "degraded" ? "bg-orange-400" : "bg-red-500"
                )} />
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp API</p>
                  <p className="text-xs text-white/50 capitalize">
                    {systemHealth?.whatsappApiStatus || "unknown"}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                "border-0",
                systemHealth?.whatsappApiStatus === "healthy" ? "bg-[#25D366]/10 text-[#25D366]" :
                systemHealth?.whatsappApiStatus === "degraded" ? "bg-orange-400/10 text-orange-400" : "bg-red-500/10 text-red-500"
              )}>
                {systemHealth?.errorRate || "0"}% error rate
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#25D366]" />
                <div>
                  <p className="text-sm font-medium text-white">Server Uptime</p>
                  <p className="text-xs text-white/50">Last 30 days</p>
                </div>
              </div>
              <Badge className="bg-[#25D366]/10 text-[#25D366] border-0">
                {systemHealth?.serverUptime || 99.9}%
              </Badge>
            </div>

            <div className="text-xs text-white/40 pt-2">
              Last checked: {systemHealth?.lastChecked ? new Date(systemHealth.lastChecked).toLocaleString() : "N/A"}
            </div>
          </CardContent>
        </Card>

        {/* Daily Order Trend */}
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#25D366]" />
              Daily Order Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyOrders.map((order) => (
                <div key={order.date} className="flex items-center justify-between">
                  <span className="text-sm text-white/60">
                    {new Date(order.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#25D366] to-emerald-500 rounded-full"
                        style={{ 
                          width: `${Math.min((order.count / Math.max(...dailyOrders.map(d => d.count))) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white w-12 text-right">
                      {order.count}
                    </span>
                  </div>
                </div>
              ))}
              {dailyOrders.length === 0 && (
                <p className="text-sm text-white/50 text-center py-8">
                  No order data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
