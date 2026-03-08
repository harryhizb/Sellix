/**
 * productStore.ts
 * Zustand global store for products — eliminates duplicate fetching across components.
 * Components that need products call useProductStore() instead of their own useEffect+fetch.
 */
import { create } from 'zustand';
import { IProduct } from '@/types/product';

interface ProductStore {
    products: IProduct[];
    isLoading: boolean;
    error: string | null;
    lastFetchedBusinessId: string | null;

    /** Fetch products for a business. Skips if already loaded for same businessId. */
    fetchProducts: (token: string, force?: boolean) => Promise<void>;
    /** Optimistically add a product (after create API succeeds) */
    addProduct: (product: IProduct) => void;
    /** Optimistically update a product */
    updateProduct: (id: string, updates: Partial<IProduct>) => void;
    /** Optimistically remove a product */
    deleteProduct: (id: string) => void;
    /** Clear the store (on logout) */
    clear: () => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
    products: [],
    isLoading: false,
    error: null,
    lastFetchedBusinessId: null,

    fetchProducts: async (token: string, force = false) => {
        // Skip fetch if we already have data and it's not a forced refresh
        if (!force && get().products.length > 0) return;

        set({ isLoading: true, error: null });
        try {
            const res = await fetch('/api/products', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch products');
            const data = await res.json();
            set({ products: data.products || [], isLoading: false });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Unknown error', isLoading: false });
        }
    },

    addProduct: (product) =>
        set((state) => ({ products: [product, ...state.products] })),

    updateProduct: (id, updates) =>
        set((state) => ({
            products: state.products.map((p) =>
                p._id === id ? { ...p, ...updates } : p
            ),
        })),

    deleteProduct: (id) =>
        set((state) => ({
            products: state.products.filter((p) => p._id !== id),
        })),

    clear: () => set({ products: [], lastFetchedBusinessId: null, error: null }),
}));
