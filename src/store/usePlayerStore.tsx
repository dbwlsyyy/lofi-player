import { uiToast } from "@/lib/toasts";
import { PlayerStoreState } from "@/types/player";
import axios from "axios";
import { FiExternalLink, FiLock, FiWifiOff } from "react-icons/fi";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createPlayerStatusSlice } from "./slices/createPlayerStatusSlice";
import { createQueueSlice } from "./slices/createQueueSlice";
import { createPlaybackSlice } from "./slices/createPlaybackSlice";

// --- [에러 핸들링 로직 분리] ---

export const handlePlaybackError = (
  error: unknown,
  rollbackState: { queue: any[]; currentIndex: number; isPlaying: boolean },
  setQueueAndPlay: (tracks: any[], index: number) => void,
  setIsPlaying: (playing: boolean) => void,
  setPosition: (pos: number) => void,
  setDuration: (dur: number) => void,
) => {
  console.error("재생 요청 실패:", error);

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const code = error.code;

    // --- 에러 UI 처리 ---
    if (status === 403) {
      const authLink = (
        <a
          href="https://open.spotify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn"
          title="스포티파이 웹에서 인증하기"
        >
          <FiExternalLink size="1.4rem" />
        </a>
      );
      uiToast.action(
        "재생 불가 (성인 인증 필요)",
        <FiLock
          size="1.6rem"
          color="#ff5555"
        />,
        authLink,
        "403-error",
      );
    } else if (status === 404) {
      uiToast.error("플레이어가 비활성화되었습니다. 새로고침 해주세요.", "device-404");
    } else if (code === "ERR_NETWORK" || error.message === "Network Error") {
      uiToast.custom(
        "네트워크 연결이 불안정합니다.",
        <FiWifiOff
          size="1.6rem"
          color="#ff5555"
        />,
        "net-error",
      );
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    } else {
      uiToast.error(`일시적인 오류가 발생했습니다. ${status ? status : ""}`, `error-${status}`);
    }

    // --- 상태 롤백 처리 ---
    if (status === 403 || status === 404) {
      if (rollbackState.queue.length > 0) {
        setQueueAndPlay(rollbackState.queue, rollbackState.currentIndex);
        setIsPlaying(rollbackState.isPlaying);
      } else {
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
      }
    } else {
      setIsPlaying(false);
    }
  } else {
    uiToast.error("알 수 없는 오류가 발생했습니다. 새로고침 해주세요.");
    setIsPlaying(false);
  }
};

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
