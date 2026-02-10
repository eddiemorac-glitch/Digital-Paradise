import { create } from 'zustand';

interface CourierTracking {
    missionId: string;
    lat: number;
    lng: number;
    metersRemaining?: number;
    tripState?: 'ON_WAY' | 'NEAR_DESTINATION' | 'ARRIVED' | 'DELIVERED';
    timestamp: string;
}

interface TrackingStore {
    couriers: Record<string, CourierTracking>;
    setCourierLocation: (data: CourierTracking) => void;
    clearTracking: (missionId: string) => void;
}

export const useTrackingStore = create<TrackingStore>((set) => ({
    couriers: {},
    setCourierLocation: (data) => set((state) => ({
        couriers: {
            ...state.couriers,
            [data.missionId]: data
        }
    })),
    clearTracking: (missionId) => set((state) => {
        const next = { ...state.couriers };
        delete next[missionId];
        return { couriers: next };
    })
}));
