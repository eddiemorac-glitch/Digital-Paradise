import api from './api';

export interface Reward {
    id: string;
    title: string;
    description: string;
    pointCost: number;
    type: 'discount' | 'free_product' | 'donation' | 'gift_card';
    imageUrl?: string;
    isActive: boolean;
}

export interface UserRedemption {
    id: string;
    userId: string;
    reward: Reward;
    code: string;
    isUsed: boolean;
    redeemedAt: string;
}

export const rewardsApi = {
    getAll: async () => {
        const response = await api.get<Reward[]>('/rewards');
        return response.data;
    },
    getMyRedemptions: async () => {
        const response = await api.get<UserRedemption[]>('/rewards/my-redemptions');
        return response.data;
    },
    redeem: async (rewardId: string) => {
        const response = await api.post<UserRedemption>(`/rewards/${rewardId}/redeem`);
        return response.data;
    },
    seed: async () => {
        const response = await api.post('/rewards/seed');
        return response.data;
    }
};
