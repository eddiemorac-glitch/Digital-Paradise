import api from './api';

export const deliveryApi = {
    getAvailable: async () => {
        const response = await api.get('/orders/delivery/available');
        return response.data;
    },
    getMyDeliveries: async () => {
        const response = await api.get('/orders/delivery/mine');
        return response.data;
    },
    claimOrder: async (id: string) => {
        const response = await api.post(`/orders/${id}/claim`);
        return response.data;
    },
    pickUpOrder: async (id: string) => {
        const response = await api.post(`/orders/${id}/pickup`);
        return response.data;
    },
    updateStatus: async (id: string, status: string, metadata?: any) => {
        const response = await api.patch(`/orders/${id}/status`, { status, metadata });
        return response.data;
    },
};
