import api from './api';

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    role: string;
    points: number;
    avatarId?: string;
    phoneNumber?: string;
    // Courier specific
    vehicleType?: string;
    vehiclePlate?: string;
    courierStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    isOnline?: boolean;
    acceptsFood?: boolean;
    acceptsParcel?: boolean;
    acceptsRides?: boolean;
}

export const userApi = {
    getProfile: async () => {
        const response = await api.get<UserProfile>('/users/profile');
        return response.data;
    },

    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        const response = await api.patch<UserProfile>('/users/profile', data);
        return response.data;
    },

    // Admin Methods
    getAll: async (): Promise<UserProfile[]> => {
        const response = await api.get<UserProfile[]>('/users');
        return response.data;
    },

    updateRole: async (id: string, role: string): Promise<UserProfile> => {
        const response = await api.patch<UserProfile>(`/users/${id}/role`, { role });
        return response.data;
    },

    deleteUser: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },

    inviteUser: async (email: string, role: string): Promise<{ message: string, tempPassword?: string }> => {
        const response = await api.post('/users/invite', { email, role });
        return response.data;
    }
};
