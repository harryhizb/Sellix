/**
 * Shared TypeScript types for the application
 */

export type BusinessType =
    | 'ECOMMERCE'
    | 'RESTAURANT'
    | 'SERVICE'
    | 'ORGANIZATION'
    | 'INSTITUTE';

export type BusinessCategory =
    | 'ecommerce'
    | 'restaurant'
    | 'service'
    | 'organization'
    | 'institute';

export type OrderType =
    | 'order'
    | 'booking'
    | 'registration'
    | 'enrollment';

export interface Business {
    _id: string;
    category: BusinessCategory;
    name: string;
    phone: string;
    description?: string;
    settings?: {
        currency?: string;
        deliveryFee?: number;
        tax?: number;
    };
    isOnboarded: boolean;
    whatsappConnection?: {
        isConnected: boolean;
        qrCode?: string;
    };
}

export interface Order {
    _id: string;
    orderNumber: string;
    businessId: string;
    customerId: string;
    type: OrderType;
    items: OrderItem[];
    subtotal: number;
    totalAmount: number;
    taxAmount?: number;
    discountAmount?: number;
    deliveryFee?: number;
    currency: string;
    status: OrderStatus;
    deliveryDetails?: DeliveryDetails;
    bookingDetails?: BookingDetails;
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    attributes?: Record<string, any>;
}

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

export interface DeliveryDetails {
    address: string;
    contact: string;
    city?: string;
    notes?: string;
}

export interface BookingDetails {
    name: string;
    preferredDate: string;
    preferredTime: string;
    phone: string;
    notes?: string;
}

export interface Customer {
    _id: string;
    businessId: string;
    phone: string;
    name?: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate?: string;
    createdAt: string;
}

export interface Product {
    _id: string;
    businessId: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    image?: string;
    attributes?: Record<string, any>;
    stock?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
