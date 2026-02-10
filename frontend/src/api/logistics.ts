import api from './api';

export interface Mission {
    id: string;
    type: 'FOOD_DELIVERY' | 'PRIVATE_PARCEL' | 'RIDE_HAILING';
    status: string;
    originAddress: string;
    originLat: number;
    originLng: number;
    destinationAddress: string;
    destinationLat: number;
    destinationLng: number;
    estimatedPrice: number;
    estimatedMinutes?: number;
    estimatedDistanceKm?: number;
    actualDistanceKm?: number;
    courierEarnings?: number;
    pickedUpAt?: string;
    completedAt?: string;
    metadata?: any;
    clientId: string;
    courierId?: string;
    isExpress?: boolean;
    restaurantName?: string;
    dropoffAddress?: string;
    createdAt: string;
}

export const logisticsApi = {
    getAvailable: async (type?: string) => {
        const response = await api.get<Mission[]>('/logistics/missions/available', { params: { type } });
        return response.data;
    },
    getMyMissions: async () => {
        const response = await api.get<Mission[]>('/logistics/missions/mine');
        return response.data;
    },
    claimMission: async (id: string) => {
        const response = await api.post<Mission>(`/logistics/missions/${id}/claim`);
        return response.data;
    },
    updateStatus: async (id: string, status: string, metadata?: any) => {
        const response = await api.patch<Mission>(`/logistics/missions/${id}/status`, { status, metadata });
        return response.data;
    },
    createMission: async (data: Partial<Mission>) => {
        const response = await api.post<Mission>('/logistics/missions', data);
        return response.data;
    },
    assignMission: async (missionId: string, courierId: string) => {
        const response = await api.post<Mission>(`/logistics/missions/${missionId}/assign`, { courierId });
        return response.data;
    },
    verifyDelivery: async (id: string, otp: string, metadata?: any) => {
        const response = await api.post<Mission>(`/logistics/missions/${id}/verify-delivery`, { otp, metadata });
        return response.data;
    }
};
