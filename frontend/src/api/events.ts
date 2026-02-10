import api from './api';
import { Event, EventType, EventRequest } from '../types/event';

export type { Event, EventType, EventRequest };

export interface CreateEventDTO {
    title: string;
    description: string;
    date: string;
    time?: string;
    locationName: string;
    venue?: string;
    latitude?: number;
    longitude?: number;
    category: string;
    type?: EventType; // Added property
    adTier?: string;
    adSize?: string;
    imageUrl?: string;
    bannerUrl?: string;
    isEcoFriendly?: boolean;
}


export interface CreateEventRequestDTO {
    title: string;
    description: string;
    date: string;
    time?: string;
    locationName: string;
    venue?: string;
    category: string;
    adTier: string;
    adSize: string;
    contactPhone?: string;
    contactEmail?: string;
    isEcoFriendly?: boolean;
}

export const eventsApi = {
    getAll: async (): Promise<Event[]> => {
        const response = await api.get<Event[]>('/events');
        return response.data;
    },

    getOne: async (id: string): Promise<Event> => {
        const response = await api.get<Event>(`/events/${id}`);
        return response.data;
    },

    create: async (data: CreateEventDTO): Promise<Event> => {
        const response = await api.post<Event>('/events', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateEventDTO>): Promise<Event> => {
        const response = await api.patch<Event>(`/events/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.delete<{ success: boolean }>(`/events/${id}`);
        return response.data;
    },

    getInBounds: async (minLat: number, maxLat: number, minLng: number, maxLng: number): Promise<any> => {
        const response = await api.get('/events/bounds', {
            params: { minLat, maxLat, minLng, maxLng }
        });
        return response.data;
    },

    seed: async (): Promise<{ message: string; count?: number }> => {
        const response = await api.post<{ message: string; count?: number }>('/events/seed');
        return response.data;
    },

    // --- REQUESTS (Phase 44) ---

    createRequest: async (data: CreateEventRequestDTO): Promise<EventRequest> => {
        const response = await api.post<EventRequest>('/events/requests', data);
        return response.data;
    },

    getAllRequests: async (status?: string): Promise<EventRequest[]> => {
        const response = await api.get<EventRequest[]>('/events/requests/all', {
            params: { status }
        });
        return response.data;
    },

    getMyRequests: async (): Promise<EventRequest[]> => {
        const response = await api.get<EventRequest[]>('/events/requests/my');
        return response.data;
    },

    updateRequestStatus: async (id: string, status: string, rejectionReason?: string): Promise<EventRequest> => {
        const response = await api.patch<EventRequest>(`/events/requests/${id}/status`, {
            status,
            rejectionReason
        });
        return response.data;
    },

    getPricing: async (): Promise<any> => {
        const response = await api.get('/events/pricing');
        return response.data;
    },

    findByIds: async (ids: string[]): Promise<Event[]> => {
        const response = await api.post<Event[]>('/events/bulk', { ids });
        return response.data;
    }
};
