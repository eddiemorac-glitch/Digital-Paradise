import api from './api';

export interface Message {
    id: string;
    content: string;
    senderId: string;
    orderId: string;
    createdAt: string;
}

export const messageApi = {
    getChat: async (orderId: string) => {
        const response = await api.get<Message[]>(`/messages/order/${orderId}`);
        return response.data;
    },
    sendMessage: async (orderId: string, content: string) => {
        const response = await api.post('/messages', { orderId, content });
        return response.data;
    }
};
