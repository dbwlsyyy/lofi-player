import { UiState } from "@/types/ui";
import { create } from "zustand";

export const useUiStore = create<UiState>((set) => ({
  isRelaxMode: false,
  toggleRelaxMode: () => set((state) => ({ isRelaxMode: !state.isRelaxMode })),

  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
