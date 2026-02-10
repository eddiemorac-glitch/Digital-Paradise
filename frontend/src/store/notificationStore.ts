import { create } from 'zustand';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'order' | 'eco' | 'promo';
}

interface NotificationStore {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'> & { id?: string }) => void;
    removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    addNotification: (notif) => {
        const id = notif.id || Math.random().toString(36).substring(7);
        set((state) => ({
            notifications: [...state.notifications.filter(n => n.id !== notif.id), { ...notif, id }]
        }));
        setTimeout(() => {
            set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id)
            }));
        }, 6000);
    },
    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id)
        }));
    },
}));
