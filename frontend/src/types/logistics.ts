export interface Mission {
    id: string;
    type: 'FOOD' | 'FOOD_DELIVERY' | 'PARCEL' | 'RIDE';
    status: 'PENDING' | 'ACCEPTED' | 'READY' | 'ON_WAY' | 'DELIVERED' | 'CANCELLED';

    // Merchant Info
    merchantId?: string;
    merchant?: {
        id: string;
        name: string;
        address: string;
        latitude?: number;
        longitude?: number;
    };
    restaurantName?: string; // Legacy fallback

    // Logistics
    originAddress?: string;
    destinationAddress?: string;
    destinationLat?: number;
    destinationLng?: number;

    // Financials
    estimatedPrice?: number;
    courierEarnings?: number;

    // Metrics
    estimatedDistanceKm?: number;
    estimatedMinutes?: number;

    // Trip State
    tripState?: 'TO_MERCHANT' | 'AT_MERCHANT' | 'TO_CUSTOMER' | 'ARRIVING';
    currentLat?: number;
    currentLng?: number;
}
