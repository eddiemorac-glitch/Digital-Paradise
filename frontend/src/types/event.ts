
/**
 * Canonical Event Type Definitions
 * Phase 44: Unified Type System
 */

export type EventTier = 'BRONZE' | 'SILVER' | 'GOLD';
export type EventAdSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type EventCategory =
    | 'concert'
    | 'festival'
    | 'workshop'
    | 'sport'
    | 'restaurant'
    | 'nightlife'
    | 'culture'
    | 'other'
    | 'SOLAR_PUNK' // Map taxonomy aliases
    | 'CHARITY';

export type EventType =
    | 'eco'
    | 'social'
    | 'concert'
    | 'festival'
    | 'gastronomy'
    | 'adventure'
    | 'fire'
    | 'reggae'
    | 'surf'
    | 'art';

// For map taxonomy (Phase 21)
export interface EventTaxonomy {
    kind: EventCategory;
    priority: number; // 0-100
    clusterStrategy: 'NORMAL' | 'ISOLATED';
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string; // Display date string
    time?: string;
    location: any; // PostGIS Geometry (Point)
    locationName: string; // Readable textual location
    venue?: string;

    // Coordinates (Geo-spatial)
    latitude?: number;
    longitude?: number;
    lat?: number; // Legacy/Map alias
    lng?: number; // Legacy/Map alias

    category: EventCategory;
    type?: EventType;

    adTier: EventTier;
    adSize: EventAdSize;

    imageUrl?: string;
    bannerUrl?: string;
    banner?: string; // Legacy alias for bannerUrl

    merchantId?: string;
    price?: number;
    currency?: string;

    attendees: number;
    isEcoFriendly: boolean;
    isActive?: boolean;
    isAvailable?: boolean;
    maxCapacity?: number;
    soldTickets?: number;

    // Temporal (Phase 43)
    startDate?: string; // ISO date for sorting

    // Map Taxonomy (Phase 21/22)
    kind?: EventCategory;
    priority?: number;
    taxonomy?: EventTaxonomy;
    avatarId?: string;
    tags?: string[];

    createdAt?: string;
    updatedAt?: string;
}

export interface EventRequest {
    id: string;
    title: string;
    description: string;
    date: string;
    time?: string;
    locationName?: string;
    venue?: string;
    category: string;
    adTier: string;
    adSize: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    contactPhone?: string;
    contactEmail?: string;
    isEcoFriendly?: boolean;
    createdAt: string;
    user?: any;
    rejectionReason?: string;

    // Phase 45: Monetization
    price?: number;
    imageUrl?: string;
    bannerUrl?: string; // Adding bannerUrl too
    paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
    paymentMetadata?: any;
}
