import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    address: string;
    isAutoDetected: boolean;
    setLocation: (lat: number, lng: number, address?: string, auto?: boolean) => void;
    setAddress: (address: string) => void;
    clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set) => ({
            latitude: null,
            longitude: null,
            address: '',
            isAutoDetected: false,
            setLocation: (lat, lng, address, auto = false) => set({
                latitude: lat,
                longitude: lng,
                address: address || '',
                isAutoDetected: auto
            }),
            setAddress: (address) => set({ address }),
            clearLocation: () => set({ latitude: null, longitude: null, address: '', isAutoDetected: false }),
        }),
        {
            name: 'caribe-location-storage',
        }
    )
);
