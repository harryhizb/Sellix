/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  Plus, Trash2, Edit, Eye, Package, Search,
  MoreHorizontal, Filter, ImageIcon, TrendingUp, TrendingDown, RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { IProduct } from "@/types/product";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProductStore } from "@/stores/productStore";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { withErrorBoundary } from "@/components/shared/ErrorBoundary";

const ProductRow = React.memo(({
  product, isSelected, onToggleSelect, onDelete, onEdit, onView
}: {
  product: IProduct; isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}) => {
  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="py-4 px-6 w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => product._id && onToggleSelect(product._id)}
          className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#25D366] focus:ring-[#25D366]/50"
        />
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-white/30" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white text-sm truncate">{product.name}</p>
            <p className="text-xs text-white/40 truncate">{product.category || "General"}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 w-32">
        <span className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
          product.inStock !== false
            ? "bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", product.inStock !== false ? "bg-[#25D366]" : "bg-red-400")} />
          {product.inStock !== false ? "Active" : "Out of Stock"}
        </span>
      </td>
      <td className="py-4 px-6 w-24">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm", (product.stockQuantity || 0) < 10 ? "text-amber-400" : "text-white/70")}>
            {product.stockQuantity || 0}
          </span>
          {(product.stockQuantity || 0) < 10 && (
            <span className="text-xs text-amber-400 px-1.5 py-0.5 bg-amber-400/10 rounded">Low</span>
          )}
        </div>
      </td>
      <td className="py-4 px-6 w-32">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white font-mono">{product.price?.toFixed(2)}</span>
          {product.discount?.value && product.discount.value > 0 && (
            <span className="text-xs text-[#25D366]">-{product.discount.value}%</span>
          )}
        </div>
      </td>
      <td className="py-4 px-6 text-right w-16">
        <ProductActions product={product} onDelete={onDelete} onEdit={onEdit} onView={onView} />
      </td>
    </tr>
  );
});
ProductRow.displayName = "ProductRow";

const ProductCardMobile = React.memo(({
  product, isSelected, onToggleSelect, onDelete, onEdit, onView
}: {
  product: IProduct; isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}) => {
  return (
    <div className="glass rounded-xl p-4 mb-3 flex flex-col gap-3 relative sm:hidden">
      <div className="absolute top-4 right-4 z-10">
        <ProductActions product={product} onDelete={onDelete} onEdit={onEdit} onView={onView} />
      </div>
      <div className="flex items-start gap-4 pr-8">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => product._id && onToggleSelect(product._id)}
          className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-[#25D366] focus:ring-[#25D366]/50 flex-shrink-0"
        />
        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-white/30" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white text-base truncate">{product.name}</p>
          <p className="text-xs text-white/40 mb-2 truncate">{product.category || "General"}</p>
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium",
            product.inStock !== false
              ? "bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          )}>
            {product.inStock !== false ? "Active" : "Out of Stock"}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-end mt-2 pt-3 border-t border-white/[0.06]">
        <div>
          <p className="text-xs text-white/40 mb-0.5">Stock</p>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-sm font-medium", (product.stockQuantity || 0) < 10 ? "text-amber-400" : "text-white/80")}>
              {product.stockQuantity || 0}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40 mb-0.5">Price</p>
          <div className="flex items-center justify-end gap-1.5">
            <span className="font-medium text-white font-mono">{product.price?.toFixed(2)}</span>
            {product.discount?.value && product.discount.value > 0 && (
              <span className="text-xs text-[#25D366]">-{product.discount.value}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
ProductCardMobile.displayName = "ProductCardMobile";

const ProductActions = ({ product, onDelete, onEdit, onView }: any) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/10 h-8 w-8">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="glass-dark border-white/[0.06] z-[100]">
      <DropdownMenuItem onClick={() => onView(product._id)} className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer">
        <Eye className="w-4 h-4 mr-2" /> View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(product._id)} className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer">
        <Edit className="w-4 h-4 mr-2" /> Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-white/[0.06]" />
      <DropdownMenuItem onClick={() => onDelete(product._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
        <Trash2 className="w-4 h-4 mr-2" /> Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

function ProductsPage() {
  const router = useRouter();
  const { token } = useAuth();

  // Zustand Global Store
  const { products, isLoading: loading, fetchProducts, deleteProduct } = useProductStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      fetchProducts(token);
    }
  }, [token, fetchProducts]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && token) {
        fetchProducts(token, true); // Force refresh on return
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [token, fetchProducts]);

  const handleDelete = useCallback(async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    // Optimistic delete
    deleteProduct(productId);
    setSelectedProducts(prev => prev.filter(id => id !== productId));

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Re-fetch on failure to rollback optimistic update
        const errorData = await res.json().catch(() => ({ error: "Failed to delete" }));
        alert(errorData.error || "Failed to delete product");
        fetchProducts(token!, true);
      }
    } catch (e) {
      console.error("Delete error:", e);
      alert("An error occurred while deleting the product");
      fetchProducts(token!, true);
    }
  }, [token, deleteProduct, fetchProducts]);

  const handleEdit = useCallback((id: string) => router.push(`/dashboard/products/${id}/edit`), [router]);
  const handleView = useCallback((id: string) => router.push(`/dashboard/products/${id}`), [router]);

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

    let successCount = 0;

    for (const productId of selectedProducts) {
      try {
        // Optimistic delete per item
        deleteProduct(productId);
        fetch(`/api/products/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => { if (res.ok) successCount++ });
      } catch (e) { }
    }

    setSelectedProducts([]);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: filteredProducts.length,
    estimateSize: () => 80, // Default row/card estimate
    overscan: 5,
  });

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) setSelectedProducts([]);
    else setSelectedProducts(filteredProducts.map(p => p._id!).filter(Boolean));
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const { inStockCount, lowStockCount } = useMemo(() => {
    return {
      inStockCount: products.filter(p => p.inStock !== false).length,
      lowStockCount: products.filter(p => (p.stockQuantity || 0) < 10 && p.inStock !== false).length
    };
  }, [products]);

  if (loading && products.length === 0) {
    return <ProductsSkeleton />;
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Products</h1>
          <p className="mt-1 text-white/50 text-sm">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchProducts(token!, true)} disabled={loading} className="rounded-full border-white/[0.08] text-white/70 hover:bg-white/5 hover:text-white h-11">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/dashboard/products/new">
            <Button className="btn-primary text-white rounded-full px-6 h-11">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Products" value={products.length.toString()} trend={12} />
        <StatCard label="In Stock" value={inStockCount.toString()} trend={5} />
        <StatCard label="Low Stock" value={lowStockCount.toString()} alert={lowStockCount > 0} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl focus:border-[#25D366]/50" />
        </div>
        <Button variant="outline" className="h-12 border-white/[0.08] text-white/70 hover:bg-white/[0.06] hover:text-white rounded-xl">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
      </div>

      <div ref={parentRef}>
        {filteredProducts.length === 0 ? (
          <div className="glass rounded-2xl overflow-hidden">
            <EmptyState onAdd={() => router.push("/dashboard/products/new")} />
          </div>
        ) : (
          <>
            <div className="hidden sm:block glass rounded-t-2xl border-b border-white/[0.06] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="py-4 px-6 text-left w-12">
                      <input type="checkbox" checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#25D366] focus:ring-[#25D366]/50" />
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Product</th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-32">Status</th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-24">Stock</th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-32">Price</th>
                    <th className="py-4 px-6 text-right text-xs font-medium text-white/40 uppercase tracking-wider w-16">Actions</th>
                  </tr>
                </thead>
              </table>
            </div>

            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
              className="glass sm:rounded-b-2xl sm:rounded-t-none bg-transparent sm:bg-[#0f172a]/50"
            >
              {items.map((virtualRow) => {
                const product = filteredProducts[virtualRow.index];
                const isSelected = product._id ? selectedProducts.includes(product._id) : false;

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="hidden sm:block w-full border-b border-white/[0.06]">
                      <table className="w-full">
                        <tbody>
                          <ProductRow
                            product={product}
                            isSelected={isSelected}
                            onToggleSelect={toggleSelect}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onView={handleView}
                          />
                        </tbody>
                      </table>
                    </div>
                    <div className="sm:hidden w-full px-0">
                      <ProductCardMobile
                        product={product}
                        isSelected={isSelected}
                        onToggleSelect={toggleSelect}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onView={handleView}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass rounded-xl px-6 py-3 shadow-2xl flex items-center gap-4 z-50">
          <span className="text-sm text-white/50">{selectedProducts.length} selected</span>
          <div className="h-4 w-px bg-white/[0.1]" />
          <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, trend, alert }: { label: string; value: string; trend?: number; alert?: boolean }) {
  const positive = (trend ?? 0) >= 0;
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <p className={cn("text-2xl font-bold font-mono", alert ? "text-amber-400" : "text-white")}>{value}</p>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-0.5 text-xs", positive ? "text-[#25D366]" : "text-red-400")}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
        <Package className="w-8 h-8 text-white/30" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
      <p className="text-white/50 mb-6 max-w-sm mx-auto text-sm">Add your first product to start selling on WhatsApp</p>
      <Button onClick={onAdd} className="btn-primary text-white rounded-full"><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 glass rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-12 glass rounded-xl animate-pulse" />
      <div className="h-96 glass rounded-2xl animate-pulse" />
    </div>
  );
}

export default withErrorBoundary(ProductsPage);
