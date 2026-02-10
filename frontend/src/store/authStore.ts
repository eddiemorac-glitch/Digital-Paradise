import { create } from 'zustand'
import { useCartStore } from './cartStore';

export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'MERCHANT' | 'COURIER' | 'USER';
    points?: number;
    name?: string;
    avatar?: string;
    avatarId?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    setAuth: (user: User, token: string, refreshToken: string) => void;
    setTokens: (token: string, refreshToken: string) => void;
    updateUser: (partialUser: Partial<User>) => void;
    logout: () => void;
}

const getInitialUser = (): User | null => {
    try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        return null;
    }
}

export const useAuthStore = create<AuthState>((set) => ({
    user: getInitialUser(),
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refresh_token'),
    setAuth: (user, token, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, refreshToken });
    },
    setTokens: (token, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
        set({ token, refreshToken });
    },
    updateUser: (partialUser) => {
        set((state) => {
            const updatedUser = state.user ? { ...state.user, ...partialUser } : null;
            if (updatedUser) {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            return { user: updatedUser };
        });
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        useCartStore.getState().clearCart();
        set({ user: null, token: null, refreshToken: null });
    }
}))
