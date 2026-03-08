/**
 * API Client Utilities
 * Type-safe functions for common API calls
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiError {
    error: string;
    details?: any;
}

/**
 * Fetch orders for the current business
 */
export async function fetchOrders(token: string, filters?: { status?: string; type?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);

    const response = await fetch(`${API_BASE}/api/orders?${params}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to fetch orders');
    }

    return response.json();
}

/**
 * Fetch products/services/events/courses for the current business
 */
export async function fetchProducts(token: string, category?: string) {
    const response = await fetch(`${API_BASE}/api/products`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to fetch products');
    }

    return response.json();
}

/**
 * Create a new order
 */
export async function createOrder(token: string, orderData: any) {
    const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to create order');
    }

    return response.json();
}

/**
 * Update business settings
 */
export async function updateBusiness(token: string, businessData: any) {
    const response = await fetch(`${API_BASE}/api/business/onboarding`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessData),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to update business');
    }

    return response.json();
}

/**
 * Fetch customers for the current business
 */
export async function fetchCustomers(token: string) {
    const response = await fetch(`${API_BASE}/api/customers`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to fetch customers');
    }

    return response.json();
}

/**
 * Fetch dashboard stats
 */
export async function fetchStats(token: string) {
    const response = await fetch(`${API_BASE}/api/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to fetch stats');
    }

    return response.json();
}
