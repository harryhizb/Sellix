"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getNavigation, type Capabilities } from '@/lib/dashboard-config';
import { MessageSquare, Wifi, WifiOff, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface DynamicSidebarProps {
  capabilities: Capabilities;
  businessName?: string;
  isConnected?: boolean;
}

export function DynamicSidebar({ capabilities, businessName, isConnected = true }: DynamicSidebarProps) {
  const pathname = usePathname();
  const navigation = getNavigation(capabilities);
  const { token } = useAuth();

  const [counts, setCounts] = useState({ pendingOrders: 0, activeChats: 0 });
  const [lastSeen, setLastSeen] = useState({ orders: 0, chats: 0 });

  const isEcommerce = capabilities.supportsProducts || capabilities.supportsCart;

  // Initialize lastSeen from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_last_seen');
      if (saved) {
        try {
          setLastSeen(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse sidebar_last_seen:", e);
        }
      }
    }
  }, []);

  // Update lastSeen when visiting tab
  useEffect(() => {
    if (!isEcommerce) return;

    let updated = false;
    const newLastSeen = { ...lastSeen };

    if (pathname === '/dashboard/orders' && counts.pendingOrders !== lastSeen.orders) {
      newLastSeen.orders = counts.pendingOrders;
      updated = true;
    } else if (pathname === '/dashboard/chat' && counts.activeChats !== lastSeen.chats) {
      newLastSeen.chats = counts.activeChats;
      updated = true;
    }

    if (updated) {
      setLastSeen(newLastSeen);
      localStorage.setItem('sidebar_last_seen', JSON.stringify(newLastSeen));
    }
  }, [pathname, counts, isEcommerce, lastSeen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchCounts = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/dashboard/counts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCounts({
            pendingOrders: data.pendingOrders || 0,
            activeChats: data.activeChats || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch sidebar counts:", err);
      }
    };

    if (isEcommerce) {
      fetchCounts();
      interval = setInterval(fetchCounts, 60000); // Poll every 60s
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token, isEcommerce]);

  const businessInitial = businessName?.charAt(0).toUpperCase() || 'B';

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header with Logo */}
      <div className="pl-4 border-b border-slate-800">
        <Link href="/" className="flex items-center group">
          <Image
            src="/logo2.png"
            alt="Sellix Logo"
            width={250}
            height={100}
            className="object-contain ml-[-3rem]" // Pulls it 24px to the left
            priority
          />
        </Link>
      </div>

      {/* Business Info */}
      <div className="px-4 py-4 border-b border-slate-800 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold shadow-lg">
            {businessInitial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate z-30 relative">
              {businessName || 'My Business'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "flex items-center gap-1.5 text-[10px] font-medium",
                isConnected ? "text-emerald-400" : "text-red-400"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isConnected ? "bg-emerald-400" : "bg-red-400"
                )} />
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          let displayBadge = item.badge;
          let badgeStyle = "bg-[#25D366]/10 text-[#25D366]";

          if (isEcommerce) {
            if (item.label === 'Orders') {
              const newOrders = Math.max(0, counts.pendingOrders - lastSeen.orders);
              displayBadge = (isActive || newOrders <= 0) ? undefined : newOrders.toString();
              badgeStyle = "bg-red-500 text-white shadow shadow-red-500/20";
            } else if (item.label === 'Chat') {
              const newChats = Math.max(0, counts.activeChats - lastSeen.chats);
              displayBadge = (isActive || newChats <= 0) ? undefined : newChats.toString();
              badgeStyle = "bg-red-500 text-white shadow shadow-red-500/20";
            }
          }

          // Ecommerce-specific active styles for Overview tab
          const isOverviewTab = item.label === 'Overview';
          const applyEcommerceMainTabStyle = isEcommerce && isOverviewTab;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? applyEcommerceMainTabStyle
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-900/10 border border-emerald-500/30 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full",
                  applyEcommerceMainTabStyle ? "bg-emerald-400 glow-text" : "bg-[#25D366]"
                )} />
              )}

              <Icon className={cn(
                "w-5 h-5 transition-colors duration-200",
                isActive
                  ? applyEcommerceMainTabStyle ? "text-emerald-400" : "text-white"
                  : "text-slate-500 group-hover:text-slate-300"
              )} />
              <span className="flex-1">{item.label}</span>
              {displayBadge && (
                <span className={cn("px-2 py-0.5 text-xs font-bold rounded-full", badgeStyle)}>
                  {displayBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Connection Status */}
      <div className="p-4 border-t border-slate-800">
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border",
          isConnected
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-red-500/5 border-red-500/20"
        )}>
          <div className="relative">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              isConnected ? "bg-emerald-400" : "bg-red-400"
            )} />
            {isConnected && (
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className={cn(
              "text-xs font-medium block",
              isConnected ? "text-emerald-400" : "text-red-400"
            )}>
              {isConnected ? "System Online" : "Disconnected"}
            </span>
            <span className="text-[10px] text-slate-500">
              {isConnected ? "All services running" : "Check connection"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
