import api from './api';

export const courierApi = {
    getStats: async () => {
        const response = await api.get('/courier/stats');
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/courier/profile');
        return response.data;
    },
    getEarningsHistory: async (days: number = 30) => {
        const response = await api.get('/courier/earnings', { params: { days } });
        return response.data;
    },
};
