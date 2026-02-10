import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { Product } from '../api/products';
import { Event } from '../api/events';
import { toast } from 'sonner';

export const useAddToCart = () => {
    const { addItem, clearCart, items } = useCartStore();
    const { language } = useLanguageStore();
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [pendingItem, setPendingItem] = useState<{ item: any; type: any } | null>(null);

    // Track the last attempted add so the mismatch event handler can reference it
    const lastAttemptRef = useRef<{ item: any; type: any } | null>(null);

    // Listen for merchant mismatch dispatched from cartStore (it uses dispatchEvent, not throw)
    useEffect(() => {
        const handler = () => {
            if (lastAttemptRef.current) {
                setPendingItem(lastAttemptRef.current);
                setShowConflictModal(true);
            }
        };
        window.addEventListener('cart_merchant_mismatch', handler);
        return () => window.removeEventListener('cart_merchant_mismatch', handler);
    }, []);

    const handleAddToCart = (item: Product | Event | any, type: any = 'product'): boolean => {
        // Store the attempt before calling addItem (which may dispatch mismatch event)
        lastAttemptRef.current = { item, type };

        const prevCount = useCartStore.getState().items.length;
        addItem(item, type);
        const newCount = useCartStore.getState().items.length;

        // If count didn't change and there were items, the add was silently blocked (mismatch or locked)
        if (newCount === prevCount && prevCount > 0) {
            // The mismatch event handler above will fire if it was a mismatch.
            // If it was locked, we just return false.
            return false;
        }

        toast.success(language === 'es' ? 'Agregado al carrito' : 'Added to cart', {
            description: item.name || item.title || '',
            duration: 2000,
        });
        return true;
    };

    const confirmConflict = () => {
        if (pendingItem) {
            // CRITICAL: Force unlock if cart was locked during a failed checkout attempt
            useCartStore.getState().setLocked(false);

            clearCart();
            addItem(pendingItem.item, pendingItem.type);
            setShowConflictModal(false);
            setPendingItem(null);

            toast.success(language === 'es'
                ? 'Carrito actualizado con nuevo comercio'
                : 'Cart updated with new merchant');
        }
    };

    const currentMerchantName = items.length > 0 ? (items[0] as any).merchantName || items[0].merchantId : '';
    const newMerchantName = pendingItem?.item?.merchantName || pendingItem?.item?.merchantId || '';

    return {
        handleAddToCart,
        showConflictModal,
        setShowConflictModal,
        confirmConflict,
        currentMerchantName,
        newMerchantName,
        language
    };
};
