/**
 * orderStore.ts
 * Zustand global store for orders — shared source of truth across dashboard and orders page.
 */
import { create } from 'zustand';

interface Order {
    _id: string;
    orderNumber?: string;
    status: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    customerId?: { name?: string; phone?: string; _id: string };
}

interface OrderStore {
    orders: Order[];
    recentOrders: Order[];  // Latest 5, used by dashboard
    isLoading: boolean;
    error: string | null;

    fetchOrders: (token: string, force?: boolean) => Promise<void>;
    updateOrderStatus: (id: string, status: string) => void;
    clear: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
    orders: [],
    recentOrders: [],
    isLoading: false,
    error: null,

    fetchOrders: async (token: string, force = false) => {
        if (!force && get().orders.length > 0) return;

        set({ isLoading: true, error: null });
        try {
            const res = await fetch('/api/orders', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch orders');
            const data = await res.json();
            const orders: Order[] = data.orders || [];
            set({
                orders,
                recentOrders: orders.slice(0, 5),
                isLoading: false,
            });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Unknown error', isLoading: false });
        }
    },

    updateOrderStatus: (id, status) =>
        set((state) => ({
            orders: state.orders.map((o) => (o._id === id ? { ...o, status } : o)),
            recentOrders: state.recentOrders.map((o) => (o._id === id ? { ...o, status } : o)),
        })),

    clear: () => set({ orders: [], recentOrders: [], error: null }),
}));
