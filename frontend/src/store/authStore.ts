import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useCartStore } from './cartStore';

export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'MERCHANT' | 'COURIER' | 'USER' | 'admin' | 'merchant' | 'delivery' | 'user';
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

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            setAuth: (user, token, refreshToken) => {
                set({ user, token, refreshToken });
            },
            setTokens: (token, refreshToken) => {
                set({ token, refreshToken });
            },
            updateUser: (partialUser) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...partialUser } : null
                }));
            },
            logout: () => {
                useCartStore.getState().clearCart();
                set({ user: null, token: null, refreshToken: null });
            }
        }),
        {
            name: 'paradise-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken
            }),
        }
    )
);
