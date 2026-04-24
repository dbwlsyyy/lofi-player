// 앨범 정보를 가져오고(Fetch), 큐에 넣고(Queue), 재생 API를 쏘는(Play)
"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import { startPlayback } from "@/apis/playbackApi";
import { Track } from "@/types/player";
import axios from "axios";
import { FiExternalLink, FiLock, FiWifiOff } from "react-icons/fi";
import { uiToast } from "@/lib/toasts";

export function usePlayControl() {
  const {
    deviceId,
    optimisticPlay,
    setIsPlaying,
    queue,
    currentIndex,
    isPlaying: wasPlaying,
    setPosition,
    setDuration,
  } = usePlayerStore();

  const playFromPlaylist = async (tracks: Track[], startIndex: number, token: string) => {
    if (!deviceId || !token) return;

    const previousQueue = queue;
    const previousIndex = currentIndex;
    const previousPlaying = wasPlaying;

    optimisticPlay(tracks, startIndex);
    const uris = tracks.map((t) => `spotify:track:${t.id}`);

    try {
      await startPlayback(uris, deviceId, token, startIndex);
    } catch (error) {
      console.error("재생 요청 실패:", error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const code = error.code;

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
          uiToast.error(
            `일시적인 오류가 발생했습니다. ${status ? status : null}`,
            `error-${status}`,
          );
        }

        if (status === 403 || status === 404) {
          if (previousQueue.length > 0) {
            optimisticPlay(previousQueue, previousIndex);
            setIsPlaying(previousPlaying);
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
    }
  };

  return { playFromPlaylist };
}
