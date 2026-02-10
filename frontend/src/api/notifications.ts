import api from './api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'eco' | 'system' | 'order' | 'success';
    isRead: boolean;
    userId?: string;
    actionLink?: string;
    createdAt: string;
}

export const notificationsApi = {
    getMine: async () => {
        const response = await api.get<Notification[]>('/notifications/mine');
        return response.data;
    },
    markAsRead: async (id: string) => {
        const response = await api.post(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await api.post('/notifications/read-all');
        return response.data;
    },

    broadcast: async (data: { title: string; message: string; type: string }): Promise<{ sent: number }> => {
        const response = await api.post('/notifications/broadcast', data);
        return response.data;
    }
};
