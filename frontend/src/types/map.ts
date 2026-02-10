/**
 * Map Component Type Definitions
 * Extracted from LiveMap.tsx for type safety
 */

// Phase 21: Advanced Taxonomy
export type EventTier = 'COMMUNITY' | 'STANDARD' | 'PREMIUM' | 'PARTNER'; // PREMIUM = GOLD
export type EventCategory = 'SOLAR_PUNK' | 'CHARITY' | 'NIGHTLIFE' | 'CULTURE' | 'SPORT' | 'FESTIVAL' | 'CONCERT' | 'WORKSHOP' | 'RESTAURANT' | 'OTHER';

export type EventKind = EventCategory; // Alias for backward compatibility

export interface EventTaxonomy {
    kind: EventKind;
    priority: number; // 0-100
    clusterStrategy: 'NORMAL' | 'ISOLATED'; // 'ISOLATED' events never cluster
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface MerchantData {
    id: string;
    name: string;
    address?: string;
    latitude: string | number;
    longitude: string | number;
    category?: string;
    avatarId?: string; // Phase 22
    status?: string;
    isActive?: boolean;
    openingHours?: any;
    operationalSettings?: any;
}

import { Event as CanonicalEvent } from './event';

export type EventData = CanonicalEvent;

export interface MissionData {
    id: string;
    status: 'READY' | 'ON_WAY' | 'DELIVERED' | 'PENDING';
    merchantId?: string;
    merchant?: MerchantData;
    originLat?: number;
    originLng?: number;
    destinationLat: number;
    destinationLng: number;
    destinationAddress: string;
    driverPos?: [number, number] | null; // Added for Phase 9
}

export interface SelectedEntity {
    type: 'EVENT' | 'MERCHANT' | 'MISSION';
    data: EventData | MerchantData | MissionData;
}

export interface MapLayers {
    weather: boolean;
    scanlines: boolean;
    merchants: boolean;
    events: boolean;
    paths: boolean;
}

export interface Hotspot {
    name: string;
    pos: [number, number];
    zoom: number;
}

export interface EventDisplacement {
    x: number;
    y: number;
    index: number;
    isCluster: boolean;
    isHero: boolean;
    count: number;
}

export interface LiveMapProps {
    missions?: MissionData[];
    events?: EventData[];
    merchants?: MerchantData[];
    focusedEvent?: EventData | null;
    driverPos?: [number, number] | null; // Added for Phase 9
    onUpdateStatus?: (id: string, status: string, isFood: boolean) => void;
    onConfirmDelivery?: (mission: MissionData) => void;
    onChatOpen?: (mission: MissionData) => void;
    onMapReady?: () => void;
}

export type SceneticEffect = 'NONE' | 'RAIN' | 'SUN';

export type TacticalMode = 'IDLE' | 'PATROL' | 'MISSION' | 'FOCUS';

export interface TacticalState {
    mode: TacticalMode;
    isPatrolling: boolean;
    isLocating: boolean;
    searchQuery: string;
    sceneticEffect: SceneticEffect;
    selectedEntity: SelectedEntity | null;
    selectedMissionId: string | null;
    activeCategories: string[] | null; // null means all
    isFixedMissionCamera: boolean;
    userPos?: [number, number] | null;
}

export interface EventGeoJSONFeature {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
    properties: Partial<EventData> & { id: string; title: string };
}

export interface EventGeoJSON {
    type: 'FeatureCollection';
    features: EventGeoJSONFeature[];
}
