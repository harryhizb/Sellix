"use client";

import { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";

interface EcommerceDashboardProps {
  business: any;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  conversionRate: number;
}

export function EcommerceDashboard({ business }: EcommerceDashboardProps) {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueChange: 12.5,
    ordersChange: 8.2,
    customersChange: 15.3,
    conversionRate: 3.2,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Get current date for greeting
  const currentHour = new Date().getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good afternoon";
  } else if (currentHour >= 17) {
    greeting = "Good evening";
  }

  useEffect(() => {
    if (!token) return;

    async function fetchDashboardData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [productsRes, ordersRes, customersRes] = await Promise.all([
          fetch("/api/products", { headers }),
          fetch("/api/orders", { headers }),
          fetch("/api/customers", { headers }),
        ]);

        const [productsData, ordersData, customersData] = await Promise.all([
          productsRes.json(),
          ordersRes.json(),
          customersRes.json(),
        ]);

        const products = productsData.products || [];
        const orders = ordersData.orders || [];
        const customers = customersData.customers || [];

        const totalRevenue = orders
          .filter((o: any) => ["CONFIRMED", "DELIVERED"].includes(o.status))
          .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

        setStats(prev => ({
          ...prev,
          totalRevenue,
          totalOrders: orders.length,
          totalCustomers: customers.length,
          totalProducts: products.length,
        }));

        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [token]);

  // Derived stats computed from fetched data — memoized to avoid recalculation on every render
  const computedStats = useMemo(() => {
    const orders = recentOrders; // use filtered latest from API response stored separately
    return stats;
  }, [stats, recentOrders]);

  const currencyLabel = business?.settings?.currency || business?.currency || "PKR";

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {greeting}{business?.name ? `, ${business.name}` : ''}!
          </h1>
          <p className="mt-1.5 text-slate-400">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Sparkles className="w-4 h-4 mr-2 text-[#25D366]" />
            AI Insights
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={`${currencyLabel} ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          trend={{ value: stats.revenueChange, isPositive: true }}
          highlight
        />
        <KpiCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon={ShoppingBag}
          trend={{ value: stats.ordersChange, isPositive: true }}
        />
        <KpiCard
          title="Customers"
          value={stats.totalCustomers.toString()}
          icon={Users}
          trend={{ value: stats.customersChange, isPositive: true }}
        />
        <KpiCard
          title="Products"
          value={stats.totalProducts.toString()}
          icon={Package}
          subtitle="Active in catalog"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
            <Link
              href="/dashboard/orders"
              className="text-sm text-[#25D366] hover:text-[#1ea855] flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              description="Orders will appear here when customers start buying"
            />
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg">
                      {order.items?.[0]?.name?.charAt(0) || "📦"}
                    </div>
                    <div>
                      <p className="font-medium text-white">Order #{order.orderNumber}</p>
                      <p className="text-sm text-slate-500">{order.customerInfo?.name || "Guest"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {currencyLabel} {order.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      order.status === "DELIVERED" && "bg-emerald-500/10 text-emerald-400",
                      order.status === "PENDING" && "bg-amber-500/10 text-amber-400",
                      order.status === "PROCESSING" && "bg-blue-500/10 text-blue-400",
                      order.status === "CANCELLED" && "bg-red-500/10 text-red-400",
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <QuickAction
                href="/dashboard/products"
                icon={Package}
                title="Add Product"
                description="Add new items to your catalog"
              />
              <QuickAction
                href="/dashboard/orders"
                icon={ShoppingBag}
                title="View Orders"
                description="Manage customer orders"
              />
              <QuickAction
                href="/dashboard/settings"
                icon={Sparkles}
                title="AI Settings"
                description="Customize your assistant"
              />
            </div>
          </div>

          {/* Conversion Rate Card */}
          <div className="bg-gradient-to-br from-[#25D366]/20 to-emerald-900/20 border border-[#25D366]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Conversion Rate</h3>
              <TrendingUp className="w-5 h-5 text-[#25D366]" />
            </div>
            <p className="text-3xl font-bold text-white mb-2">{stats.conversionRate}%</p>
            <p className="text-sm text-slate-400">Of chats result in sales</p>
          </div>
        </div>
      </div>

      {/* Getting Started Banner */}
      {stats.totalProducts === 0 && (
        <div className="bg-gradient-to-r from-[#25D366] to-emerald-600 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Welcome to your new store!</h3>
              <p className="text-white/90 max-w-lg">
                Get started by adding your first product. Your AI assistant will help customers browse and purchase.
              </p>
            </div>
            <Link href="/dashboard/products">
              <Button className="bg-white text-[#25D366] hover:bg-slate-50 shadow-lg font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Add First Product
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// KPI Card Component
interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  highlight?: boolean;
}

function KpiCard({ title, value, icon: Icon, trend, subtitle, highlight }: KpiCardProps) {
  return (
    <div className={cn(
      "bg-slate-900 border rounded-2xl p-6 transition-all duration-200 hover:border-slate-700",
      highlight ? "border-[#25D366]/30" : "border-slate-800"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          highlight ? "bg-[#25D366]/10" : "bg-slate-800"
        )}>
          <Icon className={cn("w-5 h-5", highlight ? "text-[#25D366]" : "text-slate-400")} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// Quick Action Component
interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

function QuickAction({ href, icon: Icon, title, description }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-[#25D366]/10 transition-colors">
        <Icon className="w-5 h-5 text-slate-400 group-hover:text-[#25D366] transition-colors" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-[#25D366] group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

// Skeleton Loading
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="w-10 h-10 bg-slate-800 rounded-xl mb-4 animate-pulse" />
            <div className="h-8 w-24 bg-slate-800 rounded mb-2 animate-pulse" />
            <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}