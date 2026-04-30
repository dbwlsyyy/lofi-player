"use client";

import { useEffect, useRef } from "react";
import { loadSpotifySdk } from "@/lib/loadSpotifySdk";
import { usePlayerStore } from "@/store/usePlayerStore";
import { transferToDevice } from "@/apis/playbackApi";
import { FiExternalLink, FiLock, FiUserX, FiWifiOff } from "react-icons/fi";
import { uiToast } from "@/lib/toasts";
import { useShallow } from "zustand/shallow";

export function useSpotifyPlayerSync(accessToken: string | null | undefined) {
  const {
    setPlayerInstance,
    setIsPlaying,
    setDeviceId,
    setIsReady,
    setPosition,
    setDuration,
    syncStateFromSdk,
  } = usePlayerStore(
    useShallow((state) => ({
      setPlayerInstance: state.setPlayerInstance,
      setIsPlaying: state.setIsPlaying,
      setDeviceId: state.setDeviceId,
      setIsReady: state.setIsReady,
      setPosition: state.setPosition,
      setDuration: state.setDuration,
      syncStateFromSdk: state.syncStateFromSdk,
    })),
  );

  const playerRef = useRef<Spotify.Player | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    const stopPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };

    const startPolling = () => {
      stopPolling();

      intervalRef.current = setInterval(async () => {
        const player = playerRef.current;
        if (!player) return;

        try {
          const state = await player.getCurrentState();
          if (state && !state.loading && !state.paused) {
            setPosition(state.position);
            setDuration(state.duration);
          }
        } catch (err) {
          console.error("Error getting current state:", err);
        }
      }, 500);
    };

    const init = async () => {
      try {
        if (cancelled) return; // 로드 전 체크

        await loadSpotifySdk();
        if (cancelled) return; // 로드 후 체크

        const player = new window.Spotify.Player({
          name: "Lofi Web Player",
          getOAuthToken: (cb) => cb(accessToken),
          volume: 0.5,
        });

        playerRef.current = player;
        setPlayerInstance(player);

        player.on("initialization_error", (message) => {
          console.error("player 초기화 실패", message);
          uiToast.custom(
            "플레이어 연결 실패 (네트워크 확인)",
            <FiWifiOff
              size="1.6rem"
              color="#ff5555"
            />,
            "net-error",
          );
        });

        player.on("authentication_error", ({ message }) => {
          console.error("인증 실패:", message);
          uiToast.custom(
            "인증에 실패하였습니다. 다시 로그인해주세요.",
            <FiLock
              size="1.6rem"
              color="#ff5555"
            />,
            "auth-error",
          );
        });

        player.on("account_error", ({ message }) => {
          console.error("계정 오류:", message);

          const premiumLink = (
            <a
              href="https://www.spotify.com/kr-ko/premium/"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn"
              title="스포티파이 프리미엄 결제하기"
            >
              <FiExternalLink size="1.4rem" />
            </a>
          );

          uiToast.action(
            "프리미엄 계정이 필요합니다.",
            <FiUserX
              size="1.6rem"
              color="#4f7df3c5"
            />,
            premiumLink,
            "account-error",
          );
        });

        player.on("playback_error", ({ message }) => {
          console.error("재생 실패:", message);
          uiToast.error("일시적인 재생 오류가 발생했습니다.");
        });

        player.addListener("ready", async ({ device_id }) => {
          setDeviceId(device_id);
          setIsReady(true);
          if (accessToken) {
            await transferToDevice(device_id, accessToken);
          }
        });

        player.addListener("not_ready", () => {
          setIsReady(false);
        });

        player.addListener("player_state_changed", (state) => {
          console.log("상태:", state.track_window.current_track.name);

          if (!state) {
            stopPolling();
            setIsPlaying(false);
            return;
          }

          // 곡 길이, 재생 위치 동기화 (ms)
          setDuration(state.duration);
          setPosition(state.position);

          // 재생 여부 동기화
          const isPlaying = !state.paused;
          setIsPlaying(isPlaying);

          if (!state.loading) {
            syncStateFromSdk(state, accessToken); // 현재 재생 중인 트랙 정보 동기화
          }

          if (isPlaying) startPolling();
          else stopPolling();
        });

        player.connect();
      } catch (err) {
        console.error("Spotify Player 초기화 에러:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      stopPolling();
      if (playerRef.current) {
        playerRef.current.removeListener("initialization_error");
        playerRef.current.removeListener("authentication_error");
        playerRef.current.removeListener("account_error");
        playerRef.current.removeListener("playback_error");
        playerRef.current.removeListener("ready");
        playerRef.current.removeListener("not_ready");
        playerRef.current.removeListener("player_state_changed");

        playerRef.current.disconnect();
      }
      setPlayerInstance(null);
    };
  }, [
    accessToken,
    setPlayerInstance,
    setIsPlaying,
    setDeviceId,
    setIsReady,
    setDuration,
    setPosition,
    syncStateFromSdk,
  ]);
}
