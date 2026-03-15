"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { IProduct } from "@/types/product";
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Image as ImageIcon, 
  Edit, 
  BarChart3,
  DollarSign,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const productId = params.id as string;

  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);



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
  }, [productId, token, router]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div>Product not found</div>
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
        <h1 className="text-2xl font-bold text-white">{product.name}</h1>
        <p className="text-white/50">Product details and analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Image */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Product Image
            </h2>
            <div className="aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
              {product.imageUrl ? (
                <Image 
                  src={product.imageUrl} 
                  alt={product.name} 
                  width={400} 
                  height={400} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8">
                  <ImageIcon className="w-12 h-12 text-white/30 mx-auto mb-2" />
                  <p className="text-white/50 text-sm">No image available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Name</h3>
                <p className="text-white">{product.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Category</h3>
                <p className="text-white">{product.category || 'General'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Price</h3>
                <p className="text-white font-semibold">${product.price?.toFixed(2)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Stock</h3>
                <p className={cn(
                  "font-medium",
                  product.inStock !== false 
                    ? (product.stockQuantity && product.stockQuantity < 10 ? "text-amber-400" : "text-white") 
                    : "text-red-400"
                )}>
                  {product.stockQuantity || 0} {product.inStock !== false ? (product.stockQuantity && product.stockQuantity < 10 ? "(Low Stock)" : "") : "(Out of Stock)"}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-1">Status</h3>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                  product.inStock !== false 
                    ? "bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    product.inStock !== false ? "bg-[#25D366]" : "bg-red-400"
                  )} />
                  {product.inStock !== false ? "Active" : "Out of Stock"}
                </span>
              </div>
              
              {product.discount?.value && product.discount.value > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-1">Discount</h3>
                  <p className="text-[#25D366] font-medium">-{product.discount.value}%</p>
                </div>
              )}
            </div>
            
            {product.description && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-white/70 mb-1">Description</h3>
                <p className="text-white/70">{product.description}</p>
              </div>
            )}
          </div>

          {/* Attributes */}
          {product.attributes && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Attributes
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.attributes.colors && product.attributes.colors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-white/70 mb-2">Colors</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.attributes.colors.map((color, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {product.attributes.sizes && product.attributes.sizes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-white/70 mb-2">Sizes</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.attributes.sizes.map((size, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => router.push(`/dashboard/products/${product._id}/edit`)}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ea855] text-white"
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </Button>
           
          </div>
        </div>
      </div>
    </div>
  );
}