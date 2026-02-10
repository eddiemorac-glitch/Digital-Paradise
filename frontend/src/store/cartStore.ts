import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../api/products';
import { Event } from '../types/event';

export type CartItemType = 'product' | 'event' | 'event-request';

export interface CartItem {
    id: string; // The specific Product or Event ID
    name: string;
    description: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    merchantId: string;
    itemType: CartItemType;
    isAvailable: boolean;
    category: string;
    // Extended fields for Events
    date?: string;
    time?: string;
    locationName?: string;
    venue?: string;
}

interface CartState {
    items: CartItem[];
    customerNotes: string;
    courierTip: number;
    addItem: (item: Product | Event, type?: CartItemType) => void;
    removeItem: (itemId: string) => void;
    decreaseItem: (itemId: string) => void;
    clearCart: () => void;
    setItems: (items: CartItem[]) => void;
    setNotes: (notes: string) => void;
    setTip: (tip: number) => void;
    itemCount: () => number;
    totalPrice: () => number;

    // Logic Hardening: Locking & Sync
    isLocked: boolean;
    setLocked: (locked: boolean) => void;

    lastSyncedAt: number | null;
    isSyncing: boolean;
    setSyncing: (syncing: boolean) => void;
    setLastSyncedAt: (timestamp: number) => void;
    unlock: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            customerNotes: '',
            courierTip: 0,
            isLocked: false,
            lastSyncedAt: null,
            isSyncing: false,

            setLocked: (locked) => set({ isLocked: locked }),
            setSyncing: (syncing) => set({ isSyncing: syncing }),
            setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
            unlock: () => set({ isLocked: false, isSyncing: false }),

            addItem: (item, type = 'product') => {
                if (get().isLocked) return; // Guard
                const currentItems = get().items;

                // MERCHANT CONSISTENCY CHECK
                const incomingMerchantId = item.merchantId || (item as any).userId || 'system';
                if (currentItems.length > 0 && currentItems[0].merchantId !== incomingMerchantId) {
                    // Instead of throwing, we notify the user via a global event or simply return
                    // In a real app, we might want to show a "Clear cart and add new merchant?" modal
                    window.dispatchEvent(new CustomEvent('cart_merchant_mismatch', {
                        detail: {
                            currentMerchant: currentItems[0].merchantId,
                            newMerchant: incomingMerchantId
                        }
                    }));
                    return;
                }

                const existingItem = currentItems.find(i => i.id === item.id);

                if (existingItem) {
                    set({
                        items: currentItems.map(i =>
                            i.id === item.id
                                ? { ...i, quantity: i.quantity + 1 }
                                : i
                        ),
                    });
                } else {
                    // Check if it's already a CartItem (has itemType)
                    if ('itemType' in item) {
                        set({ items: [...currentItems, item as CartItem] });
                        return;
                    }

                    // Map Product or Event to CartItem
                    const cartItem: CartItem = {
                        id: item.id,
                        name: 'name' in item ? item.name : (item as any).title, // Both Event and EventRequest use title
                        description: item.description || '',
                        price: item.price || 0,
                        imageUrl: item.imageUrl || '',
                        merchantId: item.merchantId || (item as any).userId || 'system', // Requests have userId
                        itemType: type as CartItemType,
                        isAvailable: 'isAvailable' in item ? (item as any).isAvailable : true, // Default to true if not present
                        category: item.category || 'other',
                        quantity: 1,
                        // Map Event specific fields
                        date: 'date' in item ? (item as any).date : undefined,
                        time: 'time' in item ? (item as any).time : undefined,
                        locationName: 'locationName' in item ? (item as any).locationName : undefined,
                        venue: 'venue' in item ? (item as any).venue : undefined
                    };
                    set({ items: [...currentItems, cartItem] });
                }
            },

            decreaseItem: (itemId: string) => {
                if (get().isLocked) return; // Guard
                const currentItems = get().items;
                const existingItem = currentItems.find(i => i.id === itemId);

                if (existingItem && existingItem.quantity > 1) {
                    set({
                        items: currentItems.map(i =>
                            i.id === itemId
                                ? { ...i, quantity: i.quantity - 1 }
                                : i
                        ),
                    });
                } else {
                    set({
                        items: currentItems.filter(i => i.id !== itemId),
                    });
                }
            },

            removeItem: (itemId: string) => {
                if (get().isLocked) return; // Guard
                set({
                    items: get().items.filter(i => i.id !== itemId),
                });
            },

            clearCart: () => {
                if (get().isLocked) return; // Guard
                set({ items: [], customerNotes: '', courierTip: 0 });
            },
            setItems: (items: CartItem[]) => set({ items }),
            setNotes: (customerNotes: string) => set({ customerNotes }),
            setTip: (courierTip: number) => set({ courierTip }),

            itemCount: () => get().items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0),

            totalPrice: () => get().items.reduce((acc: number, item: CartItem) => acc + (item.price * item.quantity), 0),
        }),
        {
            name: 'caribe-cart-storage',
            partialize: (state) => ({
                items: state.items,
                customerNotes: state.customerNotes,
                courierTip: state.courierTip,
            }),
        }
    )
);
