import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    imageUrl?: string;
    businessSlug: string;
    businessId: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (productId: string, variant?: string) => void;
    updateQuantity: (productId: string, quantity: number, variant?: string) => void;
    clearCart: () => void;
    getItemCount: () => number;
    getSubtotal: () => number;
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                set((state) => {
                    const existing = state.items.find(
                        (i) => i.productId === newItem.productId && i.variant === newItem.variant
                    );
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i.productId === newItem.productId && i.variant === newItem.variant
                                    ? { ...i, quantity: i.quantity + newItem.quantity }
                                    : i
                            ),
                        };
                    }
                    return { items: [...state.items, newItem] };
                });
            },

            removeItem: (productId, variant) => {
                set((state) => ({
                    items: state.items.filter(
                        (i) => !(i.productId === productId && i.variant === variant)
                    ),
                }));
            },

            updateQuantity: (productId, quantity, variant) => {
                if (quantity <= 0) {
                    get().removeItem(productId, variant);
                    return;
                }
                set((state) => ({
                    items: state.items.map((i) =>
                        i.productId === productId && i.variant === variant
                            ? { ...i, quantity }
                            : i
                    ),
                }));
            },

            clearCart: () => set({ items: [] }),

            getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

            getSubtotal: () =>
                get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        }),
        {
            name: "sellix-cart",
        }
    )
);
