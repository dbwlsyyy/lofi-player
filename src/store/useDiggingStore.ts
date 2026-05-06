import { create } from "zustand";
import { SearchFilter } from "@/types/domainTypes";

interface DiggingState {
  query: string;
  filter: SearchFilter;
  setQuery: (query: string) => void;
  setFilter: (filter: SearchFilter) => void;
  clearSearch: () => void;
}

export const useDiggingStore = create<DiggingState>((set) => ({
  query: "",
  filter: "track", // 기본값 '곡'
  setQuery: (query) => set({ query }),
  setFilter: (filter) => set({ filter }),
  clearSearch: () => set({ query: "" }),
}));
