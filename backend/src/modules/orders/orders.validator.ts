import { Injectable, BadRequestException } from '@nestjs/common';
import { Product } from '../products/entities/product.entity';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class OrderValidator {
    validateMerchantMatch(merchantId: string, items: (Product | Event)[]) {
        for (const item of items) {
            // Events might (optionally) have a merchantId, if they do, validate it.
            // If they don't, they are global/system events.
            if ('merchantId' in item && item.merchantId && item.merchantId !== merchantId) {
                const name = 'name' in item ? item.name : (item as Event).title;
                throw new BadRequestException(`Item ${name} does not belong to the selected merchant`);
            }
        }
    }

    validateAvailability(items: (Product | Event)[]) {
        for (const item of items) {
            const isAvailable = 'isAvailable' in item ? item.isAvailable : (item as Event).isActive;
            if (!isAvailable) {
                const name = 'name' in item ? item.name : (item as Event).title;
                throw new BadRequestException(`Item ${name} is currently not available`);
            }
        }
    }

    validateAllExist(requestedIds: string[], foundItems: (Product | Event)[]) {
        if (requestedIds.length !== foundItems.length) {
            const foundIds = new Set(foundItems.map(p => p.id));
            const missing = requestedIds.filter(id => !foundIds.has(id));
            throw new BadRequestException(`Items not found: ${missing.join(', ')}`);
        }
    }

    validateMerchantAvailability(merchant: any) {
        if (!merchant.isActive) {
            throw new BadRequestException(`El comercio "${merchant.name}" no está aceptando pedidos en este momento (Desconectado).`);
        }

        if (merchant.operationalSettings?.isBusy) {
            throw new BadRequestException(`El comercio "${merchant.name}" está muy ocupado actualmente. Por favor, intenta de nuevo más tarde.`);
        }

        // Note: Schedule validation is usually handled by MerchantsService.isAvailable
        // but if we have the merchant object here, we could potentially do a basic check.
        // However, it's safer to rely on the service logic for complex calculations.
    }
}
