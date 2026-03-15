"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Building2, 
  Search, 
  MoreVertical, 
  Eye, 
  PowerOff, 
  Power, 
  RefreshCw, 
  MessageSquare,
  ShoppingCart,
  Package,
  AlertCircle,
  Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Business {
  _id: string;
  name: string;
  contactPhone: string;
  category: string;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  status: "active" | "suspended";
  createdAt: string;
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);



  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const res = await fetch(`/api/admin/businesses?${params}`);
      if (!res.ok) throw new Error("Failed to fetch businesses");
      
      const data = await res.json();
      setBusinesses(data.businesses);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to load businesses",
      //   variant: "destructive"
      // });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses, page, statusFilter]);

  async function handleSuspendBusiness(businessId: string, currentStatus: string) {
    try {
      const action = currentStatus === "active" ? "suspend" : "reactivate";
      const res = await fetch(`/api/admin/businesses?action=${action}&id=${businessId}`, {
        method: "PATCH"
      });

      if (!res.ok) throw new Error("Failed to update business");

      const data = await res.json();
      
      setBusinesses(businesses.map(b => 
        b._id === businessId ? { ...b, status: data.business.status } : b
      ));

      // toast({
      //   title: "Success",
      //   description: `Business ${action === "suspend" ? "suspended" : "reactivated"} successfully`
      // });
    } catch (error) {
      console.error("Error updating business:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to update business",
      //   variant: "destructive"
      // });
    }
  }

  async function handleResetConnection(businessId: string) {
    try {
      const res = await fetch(`/api/admin/businesses?action=reset_connection&id=${businessId}`, {
        method: "PATCH"
      });

      if (!res.ok) throw new Error("Failed to reset connection");

      // toast({
      //   title: "Success",
      //   description: "Connection reset initiated"
      // });
    } catch (error) {
      console.error("Error resetting connection:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to reset connection",
      //   variant: "destructive"
      // });
    }
  }

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.contactPhone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Businesses Management</h1>
          <p className="text-white/60">Manage all businesses on the platform</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="admin-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <Button onClick={fetchBusinesses} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card className="admin-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06]">
                <TableHead className="text-white/60">Business Name</TableHead>
                <TableHead className="text-white/60">Category</TableHead>
                <TableHead className="text-white/60">Contact</TableHead>
                <TableHead className="text-white/60">Products</TableHead>
                <TableHead className="text-white/60">Orders</TableHead>
                <TableHead className="text-white/60">Customers</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-white/[0.06]">
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBusinesses.length === 0 ? (
                <TableRow className="border-white/[0.06]">
                  <TableCell colSpan={8} className="text-center py-12 text-white/50">
                    No businesses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBusinesses.map((business) => (
                  <TableRow key={business._id} className="border-white/[0.06]">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#25D366] to-emerald-600 flex items-center justify-center text-white font-semibold">
                          {business.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{business.name}</div>
                          <div className="text-xs text-white/40">ID: {business._id.slice(-6)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#25D366]/10 text-[#25D366] border-0 capitalize">
                        {business.category || "ecommerce"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/60">
                      {business.contactPhone || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-white/60">
                        <Package className="w-4 h-4" />
                        {business.totalProducts || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-white/60">
                        <ShoppingCart className="w-4 h-4" />
                        {business.totalOrders || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-white/60">
                        <Users className="w-4 h-4" />
                        {business.totalCustomers || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          "border-0 capitalize",
                          business.status === "active" 
                            ? "bg-[#25D366]/10 text-[#25D366]" 
                            : "bg-red-500/10 text-red-500"
                        )}
                      >
                        {business.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-admin border-white/[0.06]">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            View Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetConnection(business._id)}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset Connection
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSuspendBusiness(business._id, business.status)}
                            className={cn(
                              business.status === "active" ? "text-red-400" : "text-[#25D366]"
                            )}
                          >
                            {business.status === "active" ? (
                              <>
                                <PowerOff className="w-4 h-4 mr-2" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4 mr-2" />
                                Reactivate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          Showing page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
