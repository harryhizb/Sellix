"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Building2, 
  ShoppingCart, 
  MessageSquare, 
  Star, 
  Bell, 
  Settings,
  LogOut,
  Menu,
  X,
  Wifi,
  Activity,
  Shield,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const adminNavItems = [
  {
    title: "Platform Overview",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "Businesses",
    href: "/admin/businesses",
    icon: Building2
  },
  {
    title: "Feedback & Ratings",
    href: "/admin/feedback",
    icon: Star
  },
  {
    title: "System Settings",
    href: "/admin/settings",
    icon: Settings
  }
];
// Removed: Orders Monitor, Conversations Monitor, Notifications Monitor

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if current path is the login page
  const isLoginPage = pathname === "/admin/login";

  // Handle logout
  async function handleLogout() {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      localStorage.removeItem("admin_token");
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  useEffect(() => {
    // Don't verify auth on login page
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const verifyAuth = async () => {
      try {
        const res = await fetch("/api/admin/auth/verify");
        const data = await res.json();

        if (data.valid && data.user) {
          setIsAuthenticated(true);
          setAdminUser(data.user);
        } else {
          // Not authenticated, redirect to login
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [router, isLoginPage]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080C10]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  // If not authenticated and not on login page, don't render layout
  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  // If on login page, don't wrap with layout - let the page render directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#080C10]">
      {/* Global Styles */}
      <style>{`
        .glass-admin {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
        }
        .admin-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.08);
        }
        .admin-nav-item {
          transition: all 0.2s ease;
        }
        .admin-nav-item:hover {
          background: rgba(37,211,102,0.1);
          border-left: 3px solid #25D366;
        }
        .admin-nav-item.active {
          background: linear-gradient(90deg, rgba(37,211,102,0.15), transparent);
          border-left: 3px solid #25D366;
          color: #25D366;
        }
      `}</style>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:relative z-50 w-72 h-full glass-admin border-r border-white/[0.06] flex flex-col transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-emerald-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Sellix</h1>
              <p className="text-xs text-white/50">Super Admin</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-auto text-white/60"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <div className="px-3 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "admin-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                    isActive ? "active text-white" : "text-white/60 hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-[#25D366]" : "text-white/40"
                  )} />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/[0.06]">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/50 hover:text-red-400 hover:bg-red-500/10"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 glass-admin border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white/60"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
            
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/20">
              <Wifi className="w-4 h-4 text-[#25D366]" />
              <span className="text-sm font-medium text-[#25D366]">System Online</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {adminUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/[0.05]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#25D366] to-emerald-600 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium text-white">{adminUser.email}</p>
                      <p className="text-xs text-white/50">Super Admin</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-admin border-white/[0.08]">
                  <DropdownMenuLabel className="text-white">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#25D366]" />
                      Account
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/[0.08]" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-400 cursor-pointer hover:!bg-red-500/10 focus:!bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
