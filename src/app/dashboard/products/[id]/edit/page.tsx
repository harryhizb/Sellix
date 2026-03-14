"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { IProduct } from "@/types/product";
import {
  Upload,
  Package,
  Tag,
  Image as ImageIcon,
  X,
  Plus,
  Minus,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useProductStore } from "@/stores/productStore";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { fetchProducts } = useProductStore();
  const productId = params.id as string;

  const [product, setProduct] = useState<IProduct>({
    _id: "",
    businessId: "",
    name: "",
    description: "",
    price: 0,
    currency: "USD",
    category: "",
    inStock: true,
    stockQuantity: 0,
    imageUrl: "",
    discount: { value: 0, type: "percentage" },
    attributes: { colors: [], sizes: [] },
    variants: [],
    tags: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, [token]);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
      } else {
        router.push('/dashboard/products');
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      router.push('/dashboard/products');
    } finally {
      setLoading(false);
    }
  }, [token, productId, router]);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [fetchProduct, fetchCategories]);

  const handleChange = (field: keyof IProduct, value: any) => {
    setProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAttributeChange = (attrType: 'colors' | 'sizes', value: string) => {
    const values = value.split(',').map(v => v.trim()).filter(v => v);
    setProduct(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attrType]: values
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      });

      if (res.ok) {
        await fetchProducts(token!, true);
        router.push('/dashboard/products');
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("An error occurred while updating the product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-white/70 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-2xl font-bold text-white">Edit Product</h1>
        <p className="text-white/50">Update your product details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Product Name *</label>
                <Input
                  value={product.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 mb-2 flex justify-between">
                  Category
                  <Link href="/dashboard/categories" className="text-xs text-[#25D366] hover:underline">Manage</Link>
                </label>
                {categories.length > 0 ? (
                  <select
                    value={(product as any).categoryId || ""}
                    onChange={(e) => {
                      const selectedCat = categories.find(c => c._id === e.target.value);
                      setProduct({ 
                        ...product, 
                        categoryId: e.target.value,
                        category: selectedCat ? selectedCat.name : ""
                      } as any);
                    }}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg h-10 px-3 appearance-none focus:outline-none focus:border-[#25D366]/50"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id} className="bg-[#080C10]">{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={product.category || ""}
                      onChange={(e) => handleChange('category', e.target.value)}
                      placeholder="e.g., Clothing... (Create via Categories tab)"
                      className="bg-white/5 border-white/10 text-white/50 placeholder:text-white/30"
                      disabled
                    />
                    <p className="text-xs text-amber-400">Please create categories first in the Categories tab.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
                <Textarea
                  value={product.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={product.price || 0}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>
          </div>

          {/* Inventory & Images */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Inventory & Images
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Main Image URL</label>
                <Input
                  value={product.imageUrl || ''}
                  onChange={(e) => handleChange('imageUrl', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Stock Quantity</label>
                  <Input
                    type="number"
                    value={product.stockQuantity || 0}
                    onChange={(e) => handleChange('stockQuantity', parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">In Stock</label>
                  <select
                    value={product.inStock ? 'true' : 'false'}
                    onChange={(e) => handleChange('inStock', e.target.value === 'true')}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Discount (%)</label>
                <Input
                  type="number"
                  value={product.discount?.value || 0}
                  onChange={(e) => handleChange('discount', {
                    ...product.discount!,
                    value: parseInt(e.target.value) || 0
                  })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Product Attributes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Colors (comma separated)</label>
              <Input
                value={product.attributes?.colors?.join(', ') || ''}
                onChange={(e) => handleAttributeChange('colors', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                placeholder="Red, Blue, Green"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Sizes (comma separated)</label>
              <Input
                value={product.attributes?.sizes?.join(', ') || ''}
                onChange={(e) => handleAttributeChange('sizes', e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                placeholder="Small, Medium, Large"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-white/20 text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#25D366] hover:bg-[#1ea855] text-white px-6"
            disabled={saving}
          >
            {saving ? 'Updating...' : 'Update Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}