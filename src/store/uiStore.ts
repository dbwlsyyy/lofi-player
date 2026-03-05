import { create } from 'zustand';

interface UIState {
    isRelaxMode: boolean;
    toggleRelaxMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isRelaxMode: false,
    toggleRelaxMode: () =>
        set((state) => ({ isRelaxMode: !state.isRelaxMode })),
}));
