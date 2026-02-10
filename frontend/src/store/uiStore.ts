import { create } from 'zustand';

interface UIState {
    isEventHubOpen: boolean;
    setIsEventHubOpen: (isOpen: boolean) => void;
    toggleEventHub: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isEventHubOpen: false,
    setIsEventHubOpen: (isEventHubOpen) => set({ isEventHubOpen }),
    toggleEventHub: () => set((state) => ({ isEventHubOpen: !state.isEventHubOpen })),
}));
