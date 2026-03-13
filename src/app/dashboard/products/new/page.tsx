"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Plus, X, Upload } from "lucide-react";
import Link from "next/link";
import { useProductStore } from "@/stores/productStore";

interface Variant {
  id: string;
  color: string;
  size: string;
  price: number;
  stock: number;
}

const AVAILABLE_COLORS = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Gray", "Brown", "Orange", "Navy"];
const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];

export default function NewProductPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { fetchProducts } = useProductStore();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    basePrice: "",
    description: "",
    inStock: true,
    category: "",
    categoryId: "",
    imageUrl: "",
    images: [] as { publicId: string; secureUrl: string }[],
    discount: "", // Keep as string for input, convert later
  });

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);

  // Fetch categories
  useEffect(() => {
    if (token) {
      fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data.categories) {
            setCategories(data.categories);
            // Default select the first category if none is selected
            if (data.categories.length > 0 && !formData.categoryId) {
              setFormData(prev => ({ ...prev, categoryId: data.categories[0]._id, category: data.categories[0].name }));
            }
          }
        })
        .catch(console.error);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate variants when colors or sizes change
  const generateVariants = () => {
    const newVariants: Variant[] = [];
    selectedColors.forEach((color) => {
      selectedSizes.forEach((size) => {
        const existing = variants.find(v => v.color === color && v.size === size);
        newVariants.push({
          id: `${color}-${size}`,
          color,
          size,
          price: existing ? existing.price : Number(formData.basePrice) || 0,
          stock: existing ? existing.stock : 0,
        });
      });
    });
    setVariants(newVariants);
  };

  // Update variant price/stock
  const updateVariant = (id: string, field: "price" | "stock", value: number) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  // Handle image upload (supports multiple files)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !token) return;

    setUploadingImage(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return { publicId: data.publicId, secureUrl: data.secureUrl };
        } else {
          throw new Error("Failed to upload");
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // Add new images to the array
      setFormData(prev => ({ 
        ...prev, 
        images: [...prev.images, ...results.filter(img => img !== undefined)]
      }));
      
      // Set first image as main imageUrl if not set
      if (!formData.imageUrl && results.length > 0) {
        setFormData(prev => ({ ...prev, imageUrl: results[0].secureUrl }));
      }
    } catch (error) {
      alert("Failed to upload some images");
      console.error("Upload error:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove specific image from array
  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      // If removed image was the main imageUrl, update it
      if (prev.imageUrl === prev.images[index]?.secureUrl) {
        return {
          ...prev,
          images: newImages,
          imageUrl: newImages.length > 0 ? newImages[0].secureUrl : ""
        };
      }
      return { ...prev, images: newImages };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user?.businessId) {
      alert("You must be logged in with a business account");
      return;
    }

    // Allow products without variants (simple products)
    // But if colors or sizes are selected, require at least one variant
    if ((selectedColors.length > 0 || selectedSizes.length > 0) && variants.length === 0) {
      alert("Please generate variants for the selected colors and sizes");
      return;
    }

    setLoading(true);

    // Build product object matching the backend schema
    const productData: any = {
      name: formData.name,
      price: Number(formData.basePrice),
      description: formData.description,
      inStock: formData.inStock,
      imageUrl: formData.imageUrl,
      images: formData.images.length > 0 ? formData.images : undefined,
      categoryId: (formData as any).categoryId || null,
      category: formData.category, // Send name for fallback in old fields
      businessId: user.businessId,
      currency: "PKR",
      attributes: {
        colors: selectedColors,
        sizes: selectedSizes,
      },
      variants: variants.map(v => ({
        name: `${v.color}, ${v.size}`,
        price: v.price,
        stock: v.stock,
        sku: `${formData.name.substring(0, 3).toUpperCase()}-${v.color.substring(0, 2).toUpperCase()}-${v.size}`,
        attributes: { color: v.color, size: v.size },
      })),
    };

    // Add discount only if a valid positive number is provided
    const discountValue = formData.discount ? Number(formData.discount) : 0;
    if (discountValue > 0 && discountValue <= 100) {
      productData.discount = {
        type: "percentage",
        value: discountValue,
      };
      console.log("✅ Discount added:", discountValue + "%");
    } else {
      console.log("ℹ️ No discount added (value: " + discountValue + ")");
    }

    // Debug: Show complete product data
    console.log("📦 Sending product data:", JSON.stringify(productData, null, 2));

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        await fetchProducts(token!, true);
        router.push("/dashboard/products");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create product");
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="outline" size="icon" className="rounded-full border-white/[0.08] text-white/70 hover:bg-white/5 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add Product</h1>
          <p className="text-white/50 text-sm">Create a new product with variants</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Basic Information</h3>

          {/* Product Name */}
          <div className="space-y-2">
            <Label className="text-white/80">Product Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Parda Chadar"
              required
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11"
            />
          </div>

          {/* Base Price and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80">Base Price (PKR) *</Label>
              <Input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="0.00"
                required
                min="0"
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80 flex justify-between">
                Category
                <Link href="/dashboard/categories" className="text-xs text-[#25D366] hover:underline">Manage</Link>
              </Label>
              {categories.length > 0 ? (
                <select
                  value={(formData as any).categoryId || ""}
                  onChange={(e) => {
                    const selectedCat = categories.find(c => c._id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      categoryId: e.target.value,
                      category: selectedCat ? selectedCat.name : ""
                    } as any);
                  }}
                  className="w-full bg-white/[0.04] border-white/[0.08] text-white focus:border-[#25D366]/50 rounded-xl h-11 px-3 appearance-none"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id} className="bg-[#080C10]">{c.name}</option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-col gap-2">
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Clothing... (Create via Categories tab)"
                    className="bg-white/[0.04] border-white/[0.08] text-white/50 placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11"
                    disabled
                  />
                  <p className="text-xs text-amber-400">Please create categories first in the Categories tab.</p>
                </div>
              )}
            </div>
          </div>

          {/* Discount (Percentage) */}
          <div className="space-y-2">
            <Label className="text-white/80 flex items-center justify-between">
              <span>Discount (%) - Optional</span>
              {formData.discount && Number(formData.discount) > 0 && (
                <span className="text-xs px-2 py-1 bg-[#25D366]/20 text-[#25D366] rounded-full font-medium">
                  Will save {Number(formData.discount)}%
                </span>
              )}
            </Label>
            <Input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              placeholder="0"
              min="0"
              max="100"
              step="0.1"
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl h-11"
            />
            <div className="flex items-start gap-2 text-xs text-white/50">
              <span className="mt-0.5">💡</span>
              <div>
                <p>Enter discount percentage (0-100). Examples:</p>
                <ul className="mt-1 space-y-0.5 ml-1">
                  <li>• Enter <strong>10</strong> for 10% off</li>
                  <li>• Enter <strong>25.5</strong> for 25.5% off</li>
                  <li>• Leave as <strong>0</strong> or empty for no discount</li>
                </ul>
              </div>
            </div>
            {formData.basePrice && formData.discount && Number(formData.discount) > 0 && (
              <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg p-3 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Original Price:</span>
                  <span className="text-white font-mono">PKR {Number(formData.basePrice).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-[#25D366]">Discount ({Number(formData.discount)}%):</span>
                  <span className="text-[#25D366] font-mono">-PKR {(Number(formData.basePrice) * Number(formData.discount) / 100).toFixed(2)}</span>
                </div>
                <div className="border-t border-[#25D366]/20 mt-2 pt-2 flex items-center justify-between">
                  <span className="text-white font-medium">Final Price:</span>
                  <span className="text-white font-bold font-mono text-lg">
                    PKR {(Number(formData.basePrice) * (1 - Number(formData.discount) / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-white/80">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product..."
              rows={3}
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-[#25D366]/50 rounded-xl resize-none"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-white/80">Product Images (Upload up to 3 images)</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            {formData.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative w-full aspect-square rounded-xl overflow-hidden border border-white/[0.08] group">
                    <img 
                      src={img.secureUrl} 
                      alt={`Product ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-[#25D366] text-white text-xs rounded font-medium">
                        Main
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {formData.images.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-2 text-white/50 hover:border-[#25D366]/50 hover:text-[#25D366] transition-colors"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-6 h-6" />
                        <span className="text-sm">Add More</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full max-w-md h-40 rounded-xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-2 text-white/50 hover:border-[#25D366]/50 hover:text-[#25D366] transition-colors"
              >
                {uploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <div className="text-center">
                      <p className="font-medium">Click to upload images</p>
                      <p className="text-xs mt-1">Supports multiple images (max 3 will be sent to customers)</p>
                    </div>
                  </>
                )}
              </button>
            )}
            <p className="text-xs text-white/50">
              💡 The first image will be the main thumbnail. Additional images will be shown to customers when viewing product details.
            </p>
          </div>
        </div>

        {/* Variants Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Product Variants</h3>

          {/* Colors */}
          <div className="space-y-2">
            <Label className="text-white/80">Available Colors</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    const newColors = selectedColors.includes(color)
                      ? selectedColors.filter(c => c !== color)
                      : [...selectedColors, color];
                    setSelectedColors(newColors);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedColors.includes(color)
                    ? "bg-[#25D366] border-[#25D366] text-white"
                    : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]"
                    }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-2">
            <Label className="text-white/80">Available Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    const newSizes = selectedSizes.includes(size)
                      ? selectedSizes.filter(s => s !== size)
                      : [...selectedSizes, size];
                    setSelectedSizes(newSizes);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedSizes.includes(size)
                    ? "bg-[#25D366] border-[#25D366] text-white"
                    : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]"
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Variants Button */}
          <Button
            type="button"
            onClick={generateVariants}
            disabled={selectedColors.length === 0 || selectedSizes.length === 0}
            variant="outline"
            className="rounded-full border-white/[0.08] text-white/70 hover:bg-white/5 hover:text-white"
          >
            Generate {selectedColors.length * selectedSizes.length} Variants
          </Button>

          {/* Variants Table */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white/80">Variant Pricing & Stock</Label>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.06]">
                    <tr>
                      <th className="px-4 py-3 text-left text-white/70 font-medium">Variant</th>
                      <th className="px-4 py-3 text-left text-white/70 font-medium">Price (PKR)</th>
                      <th className="px-4 py-3 text-left text-white/70 font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {variants.map((variant) => (
                      <tr key={variant.id}>
                        <td className="px-4 py-3 text-white">{variant.color}, {variant.size}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariant(variant.id, "price", Number(e.target.value))}
                            className="w-24 h-8 bg-white/[0.06] border-white/[0.08] text-white text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(variant.id, "stock", Number(e.target.value))}
                            className="w-24 h-8 bg-white/[0.06] border-white/[0.08] text-white text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* In Stock Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <div>
            <p className="font-medium text-white">In Stock</p>
            <p className="text-sm text-white/50">Product is available for purchase</p>
          </div>
          <Switch
            checked={formData.inStock}
            onCheckedChange={(checked) => setFormData({ ...formData, inStock: checked })}
            className="data-[state=checked]:bg-[#25D366]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Link href="/dashboard/products" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-white/[0.08] text-white/70 hover:bg-white/5 hover:text-white h-11"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || !formData.name || !formData.basePrice}
            className="flex-1 rounded-full bg-[#25D366] hover:bg-[#1ea855] text-white h-11 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}