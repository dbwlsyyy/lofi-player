import { UIState } from "@/types/ui";
import { create } from "zustand";

export const useUIStore = create<UIState>((set) => ({
  isRelaxMode: false,
  toggleRelaxMode: () => set((state) => ({ isRelaxMode: !state.isRelaxMode })),

  isSidebarOpen: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
