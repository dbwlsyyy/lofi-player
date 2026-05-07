import { create } from "zustand";
import { LyricsData } from "@/types/domainTypes";
import { fetchLyrics } from "@/apis/lyricsApi";

interface LyricsState {
  lyrics: LyricsData | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getLyrics: (trackName: string, artistName: string, albumName: string, duration: number) => Promise<void>;
  clearLyrics: () => void;
}

export const useLyricsStore = create<LyricsState>((set) => ({
  lyrics: null,
  isLoading: false,
  error: null,

  getLyrics: async (trackName, artistName, albumName, duration) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchLyrics(trackName, artistName, albumName, duration);
      if (data) {
        set({ lyrics: data, isLoading: false });
      } else {
        set({ lyrics: null, isLoading: false, error: "가사를 찾을 수 없습니다." });
      }
    } catch (err) {
      set({ 
        lyrics: null, 
        isLoading: false, 
        error: "가사 로드 중 오류가 발생했습니다." 
      });
    }
  },

  clearLyrics: () => set({ lyrics: null, error: null, isLoading: false }),
}));
