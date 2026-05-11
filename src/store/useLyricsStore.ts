import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LyricsData } from "@/types/domainTypes";
import { fetchLyrics } from "@/apis/lyricsApi";

interface LyricsState {
  isLyricsOpen: boolean; // 가사 뷰 열림/닫힘 상태

  toggleLyrics: () => void;
}

export const useLyricsStore = create<LyricsState>()(
  persist(
    (set) => ({
      isLyricsOpen: false, // 기본값은 닫힘

      toggleLyrics: () => set((state) => ({ isLyricsOpen: !state.isLyricsOpen })),
    }),
    {
      name: "lyrics-storage", // 로컬 스토리지 키
      partialize: (state) => ({ isLyricsOpen: state.isLyricsOpen }), // isLyricsOpen 상태만 저장
    },
  ),
);
