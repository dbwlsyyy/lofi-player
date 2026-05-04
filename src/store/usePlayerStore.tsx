import { PlayerStoreState } from "@/types/player";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createPlayerStatusSlice } from "./slices/createPlayerStatusSlice";
import { createQueueSlice } from "./slices/createQueueSlice";
import { createPlaybackSlice } from "./slices/createPlaybackSlice";

export const usePlayerStore = create<PlayerStoreState>()(
  persist(
    (...a) => ({
      ...createPlayerStatusSlice(...a),
      ...createQueueSlice(...a),
      ...createPlaybackSlice(...a),
    }),
    {
      name: "lofi-player-storage", // 로컬 스토리지에 저장될 키 이름
      storage: createJSONStorage(() => localStorage),

      // partialize: 새로고침해도 날아가지 않고 유지되어야 할 상태들
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        currentTrack: state.currentTrack,
        activeUniqueKey: state.activeUniqueKey,
        volume: state.volume,
      }),
    },
  ),
);
