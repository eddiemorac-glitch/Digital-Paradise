import api from './api';

export const merchantOrderApi = {
    getMyOrders: async () => {
        const response = await api.get('/orders/merchant/my-orders');
        return response.data;
    },
    updateStatus: async (id: string, status: string) => {
        const response = await api.patch(`/orders/${id}/status`, { status });
        return response.data;
    }
};
