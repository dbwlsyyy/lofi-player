import { uiToast } from "@/lib/toasts";
import axios from "axios";
import * as Sentry from "@sentry/nextjs";
import { FiExternalLink, FiLock, FiWifiOff } from "react-icons/fi";
import { Track } from "@/types/domainTypes";

export const handlePlaybackError = (
  error: unknown,
  rollbackState: { queue: Track[]; currentIndex: number; isPlaying: boolean },
  setQueueAndPlay: (tracks: Track[], index: number) => void,
  setIsPlaying: (playing: boolean) => void,
  setPosition: (pos: number) => void,
  setDuration: (dur: number) => void,
) => {
  Sentry.captureException(error, {
    extra: {
      currentIndex: rollbackState.currentIndex,
      queueLength: rollbackState.queue.length,
      currentTrackId: rollbackState.queue[rollbackState.currentIndex]?.id,
    },
  });
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
