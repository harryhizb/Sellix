export interface ProductAttributes {
  colors?: string[];
  sizes?: string[];
  duration?: string;
  ingredients?: string[];
  spice_level?: string[];
  therapist?: string[];
  skill_level?: string[];
  brand?: string;
  material?: string;
  portion?: string[];
  weight?: string;
  dimensions?: string;
  warranty?: string;
  cuisine?: string;
  dietary?: string[];
  service_type?: string;
  equipment?: string[];
  course_level?: string;
  duration_weeks?: number;
  instructor?: string;
  [key: string]: any; // Allow additional properties
}

export interface ProductVariant {
  name: string;
  price: number;
  stock: number;
  sku: string;
  attributes?: Record<string, string>;
}

export interface ProductDiscount {
  type: "percentage" | "fixed";
  value: number;
  validUntil?: Date;
}

export interface IProduct {
  _id?: string;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  inStock: boolean;
  stockQuantity: number;
  category?: string;
  attributes?: ProductAttributes;
  variants?: ProductVariant[];
  discount?: ProductDiscount;
  tags?: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}