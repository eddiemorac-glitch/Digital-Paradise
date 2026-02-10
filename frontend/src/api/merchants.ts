import api from './api';

export interface Merchant {
    id: string;
    name: string;
    description: string;
    category: string;
    address: string;
    phone: string;
    email?: string;
    taxId?: string;
    taxIdType?: string;
    latitude: number;
    longitude: number;
    logoUrl?: string;
    bannerUrl?: string;
    status: string;
    avgRating?: number;
    reviewCount?: number;
    distance?: number;
    isSustainable?: boolean;
    isVerified?: boolean;
    isActive?: boolean;
    verificationDocuments?: { url: string; type: string; uploadedAt: string }[];
    rejectionReason?: string;
    economicActivityCode?: string;
    haciendaStatus?: 'ACTIVE' | 'INVALID' | 'NOT_CONFIGURED';
    deliveryRadius?: number;
    baseDeliveryFee?: number;
    kmFee?: number;
    prepTimeMinutes?: number;
    openingHours?: {
        [key: string]: { open: string; close: string; closed?: boolean }
    };
    socialLinks?: {
        whatsapp?: string;
        instagram?: string;
        facebook?: string;
        website?: string;
    };
    operationalSettings?: {
        isBusy?: boolean;
        busyNote?: string;
        autoCloseOnOversaturation?: boolean;
        maxConcurrentOrders?: number;
    };
}

export const merchantApi = {
    getAll: async (filters?: { category?: string, sortBy?: string, lat?: number, lng?: number, isSustainable?: boolean }) => {
        const response = await api.get<Merchant[]>('/merchants', { params: { ...filters, status: 'active' } });
        return response.data;
    },

    getAdminAll: async (filters?: { status?: string, isActive?: boolean }) => {
        const response = await api.get<Merchant[]>('/merchants', { params: filters });
        return response.data;
    },

    getPending: async () => {
        const response = await api.get<Merchant[]>('/merchants/admin/pending');
        return response.data;
    },

    getNearby: async (lat: number, lng: number, radius: number = 5000) => {
        const response = await api.get<Merchant[]>('/merchants/nearby', { params: { lat, lng, radius } });
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await api.get<Merchant>(`/merchants/${id}`);
        return response.data;
    },

    update: async (id: string, data: Partial<Merchant>) => {
        const response = await api.patch<Merchant>(`/merchants/${id}`, data);
        return response.data;
    },

    approve: async (id: string) => {
        const response = await api.post<Merchant>(`/merchants/admin/${id}/approve`);
        return response.data;
    },

    reject: async (id: string, reason: string) => {
        const response = await api.post<Merchant>(`/merchants/admin/${id}/reject`, { rejectionReason: reason });
        return response.data;
    },

    suspend: async (id: string, reason: string) => {
        const response = await api.post<Merchant>(`/merchants/admin/${id}/suspend`, { suspensionReason: reason });
        return response.data;
    },

    reactivate: async (id: string) => {
        const response = await api.post<Merchant>(`/merchants/admin/${id}/reactivate`);
        return response.data;
    },

    getMyMerchant: async () => {
        const response = await api.get<Merchant>('/merchants/my-merchant');
        return response.data;
    },

    getMyStats: async (start?: string, end?: string) => {
        const response = await api.get<any>('/merchants/my-stats', { params: { start, end } });
        return response.data;
    },

    calculateDelivery: async (id: string, lat: number, lng: number) => {
        const response = await api.get<{ fee: number, distance: number, inRange: boolean, estimatedTime: number }>(`/merchants/${id}/calculate-delivery`, { params: { lat, lng } });
        return response.data;
    },

    updateOperationalSettings: async (id: string, settings: any) => {
        const response = await api.patch<Merchant>(`/merchants/${id}/operational-settings`, settings);
        return response.data;
    },
};
