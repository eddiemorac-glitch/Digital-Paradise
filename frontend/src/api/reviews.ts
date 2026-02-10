import api from './api';

export interface Review {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user: {
        fullName: string;
    };
}

export const reviewApi = {
    create: async (data: { orderId: string; rating: number; comment?: string }) => {
        const response = await api.post('/reviews', data);
        return response.data;
    },
    getByMerchant: async (merchantId: string) => {
        const response = await api.get<Review[]>(`/reviews/merchant/${merchantId}`);
        return response.data;
    },
    getStats: async (merchantId: string) => {
        const response = await api.get<{ average: number; count: number }>(`/reviews/merchant/${merchantId}/stats`);
        return response.data;
    }
};
