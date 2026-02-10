import api from './api';

export interface ChatResponse {
    text: string;
}

export const cocoAiApi = {
    chat: async (message: string) => {
        const response = await api.post<ChatResponse>('/coco-ai/chat', { message });
        return response.data;
    },

    chatStream: async (message: string, token?: string) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/coco-ai/chat-stream`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message })
        });

        if (!response.ok) throw new Error(response.statusText);

        return response.body?.getReader();
    }
};
