import { EntitySubscriberInterface, EventSubscriber, UpdateEvent, InsertEvent } from 'typeorm';
import { Merchant } from '../entities/merchant.entity';

@EventSubscriber()
export class MerchantLocationSubscriber implements EntitySubscriberInterface<Merchant> {
    /**
     * Indicates that this subscriber only listens to Merchant events.
     */
    listenTo() {
        return Merchant;
    }

    /**
     * Called before merchant insertion.
     */
    beforeInsert(event: InsertEvent<Merchant>) {
        this.updateLocation(event.entity);
    }

    /**
     * Called before merchant update.
     */
    beforeUpdate(event: UpdateEvent<Merchant>) {
        if (event.entity) {
            // Optimization: Only update location if lat/lng changed
            // Note: event.databaseEntity contains the old values
            const oldLat = event.databaseEntity?.latitude;
            const oldLng = event.databaseEntity?.longitude;
            const newLat = event.entity.latitude;
            const newLng = event.entity.longitude;

            if (newLat !== oldLat || newLng !== oldLng) {
                this.updateLocation(event.entity);
            }
        }
    }

    private updateLocation(merchant: any) {
        // Consolidated in MerchantsService
    }
}
