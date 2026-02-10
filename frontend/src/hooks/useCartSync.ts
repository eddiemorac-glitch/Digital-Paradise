import { useCallback } from 'react';
import { useCartStore } from '../store/cartStore';
import { productApi } from '../api/products';
import { eventsApi } from '../api/events';
import { toast } from 'sonner';
import { useLanguageStore } from '../store/languageStore';

export const useCartSync = () => {
    const { items, setItems, setSyncing, setLastSyncedAt, isLocked } = useCartStore();
    const { language } = useLanguageStore();

    const syncCart = useCallback(async () => {
        if (items.length === 0 || isLocked) return;

        setSyncing(true);
        try {
            const productIds = items.filter(i => i.itemType === 'product').map(i => i.id);
            const eventIds = items.filter(i => i.itemType === 'event').map(i => i.id);

            const [latestProducts, latestEvents] = await Promise.all([
                productIds.length > 0 ? productApi.findByIds(productIds) : Promise.resolve([]),
                eventIds.length > 0 ? eventsApi.findByIds(eventIds) : Promise.resolve([])
            ]);

            const productMap = new Map(latestProducts.map(p => [p.id, p]));
            const eventMap = new Map(latestEvents.map(e => [e.id, e]));

            let changesDetected = false;
            const updatedItems = items.map(currentItem => {
                let latest;
                if (currentItem.itemType === 'product') {
                    latest = productMap.get(currentItem.id);
                } else if (currentItem.itemType === 'event') {
                    latest = eventMap.get(currentItem.id);
                }

                if (!latest) {
                    // Item might have been deleted or hidden
                    if (currentItem.isAvailable) changesDetected = true;
                    return { ...currentItem, isAvailable: false };
                }

                // Unified availability logic
                let latestIsAvailable = (latest as any).isAvailable ?? false;

                // For events, calculate availability if not present
                if (currentItem.itemType === 'event') {
                    const event = latest as any;
                    latestIsAvailable = event.isActive !== false &&
                        (event.maxCapacity === 0 || (event.soldTickets || 0) < event.maxCapacity);
                }

                const priceChanged = latest.price !== currentItem.price;
                const availabilityChanged = latestIsAvailable !== currentItem.isAvailable;

                if (priceChanged || (availabilityChanged && !latestIsAvailable)) {
                    changesDetected = true;
                }

                return {
                    ...currentItem,
                    price: latest.price ?? currentItem.price,
                    isAvailable: latestIsAvailable,
                    // Keep existing metadata like name, description etc. but could update them too
                    name: 'name' in latest ? (latest as any).name : ('title' in latest ? (latest as any).title : currentItem.name)
                };
            });

            if (changesDetected) {
                setItems(updatedItems);
                toast.info(language === 'es' ? 'Carrito actualizado' : 'Cart updated', {
                    description: language === 'es'
                        ? 'Algunos precios o disponibilidad han cambiado.'
                        : 'Some prices or availability have changed.'
                });
            }

            setLastSyncedAt(Date.now());
        } catch (error) {
            console.error('Failed to sync cart:', error);
        } finally {
            setSyncing(false);
        }
    }, [items, setItems, setSyncing, setLastSyncedAt, isLocked, language]);

    return { syncCart };
};
