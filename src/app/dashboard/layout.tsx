"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { DynamicSidebar } from "@/components/dashboard/DynamicSidebar";
import { DashboardGuard } from "@/components/dashboard/DashboardGuard";
import { useSocket } from "@/context/SocketContext";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, MessageCircle, ChevronDown, Wifi, WifiOff, LifeBuoy } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isOnboarding = pathname?.includes("/onboarding");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <DashboardGuard>
      {(capabilities: any, businessName: string, businessId: string) => {
        if (isOnboarding) {
          return <>{children}</>;
        }
        return (
          <DashboardLayoutContent
            capabilities={capabilities}
            businessName={businessName}
            businessId={businessId}
            onLogout={handleLogout}
          >
            {children}
          </DashboardLayoutContent>
        );
      }}
    </DashboardGuard>
  );
}

interface DashboardLayoutContentProps {
  capabilities: any;
  businessName: string;
  businessId: string;
  onLogout: () => void;
  children: React.ReactNode;
}

function DashboardLayoutContent({
  capabilities,
  businessName,
  businessId,
  onLogout,
  children,
}: DashboardLayoutContentProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { connectToBusiness, connectionStatus } = useSocket();

  useEffect(() => {
    if (businessId && connectionStatus?.status !== "connected" && connectionStatus?.status !== "connecting") {
      connectToBusiness(businessId);
    }
  }, [businessId, connectionStatus?.status, connectToBusiness]);

  const isConnected = connectionStatus?.status === "connected";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <DynamicSidebar
        capabilities={capabilities}
        businessName={businessName}
        isConnected={isConnected}
      />
      <div className="p-4 border-t border-white/[0.06]">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        fontFamily: "var(--font-sora), var(--font-dm-sans), sans-serif",
        background: "#080C10"
      }}
    >
      {/* Global Styles */}
      <style>{`
        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
        }
        .glass-dark {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
        }
        .btn-primary {
          background: linear-gradient(135deg, #25D366 0%, #1aab52 100%);
          box-shadow: 0 4px 24px rgba(37,211,102,0.35);
          transition: all 0.25s ease;
        }
        .btn-primary:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 32px rgba(37,211,102,0.5); 
        }
        .card-hover { 
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; 
        }
        .card-hover:hover { 
          transform: translateY(-4px); 
          border-color: rgba(37,211,102,0.3) !important; 
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(37,211,102,0.08); 
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(37,211,102,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,211,102,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .glow-text { 
          text-shadow: 0 0 60px rgba(37,211,102,0.35); 
        }
        .green-glow { 
          box-shadow: 0 0 40px rgba(37,211,102,0.25), 0 0 80px rgba(37,211,102,0.1); 
        }
        .tag-pill {
          background: linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.05));
          border: 1px solid rgba(37,211,102,0.25);
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer { 
          0% { background-position: -200% 0; } 
          100% { background-position: 200% 0; } 
        }
        .number-gradient {
          background: linear-gradient(135deg, #25D366, #7EFFC2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="w-72 glass-dark hidden md:flex flex-col border-r border-white/[0.06]">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Grid Background */}
        <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />

        {/* Topbar */}
        <header className="h-16 glass border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0 relative z-10">
          {/* Left - Mobile Menu & Breadcrumb */}
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-[#080C10] border-white/[0.06]">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* Connection Status */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
              isConnected
                ? "tag-pill text-[#25D366]"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            )}>
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* Support/Feedback Button */}
            <Link href="/dashboard/support">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white/60 hover:text-white hover:bg-white/10"
                title="Support & Feedback"
              >
                <LifeBuoy className="w-5 h-5" />
              </Button>
            </Link>

            {/* Profile Sheet (replaces dropdown) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#25D366] to-emerald-600 flex items-center justify-center text-white font-semibold text-sm green-glow group-hover:scale-105 transition-transform">
                    {businessName?.charAt(0).toUpperCase() || "B"}
                  </div>
                  <span className="hidden sm:inline font-medium">{businessName}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 glass-dark border-white/[0.06] p-0">
                <div className="p-6 border-b border-white/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#25D366] to-emerald-600 flex items-center justify-center text-white font-bold text-xl green-glow">
                      {businessName?.charAt(0).toUpperCase() || "B"}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{businessName}</h3>
                      <p className="text-sm text-white/50">Free Plan</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    onClick={onLogout}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}