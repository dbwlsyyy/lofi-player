import { setRepeatMode, setShuffle, startPlayback } from "@/apis/playbackApi";
import { mapSdkTrackToLocalTrack } from "@/lib/spotifyMapper";
import { uiToast } from "@/lib/toasts";
import { PlayerState, RepeatMode } from "@/types/player";
import axios from "axios";
import { FiExternalLink, FiLock, FiWifiOff } from "react-icons/fi";
import { create } from "zustand";

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // --- [상태 초기값] ---
  playerInstance: null,
  currentTrack: null,
  queue: [],
  currentIndex: 0,
  deviceId: null,
  isReady: false,
  isPlaying: false,
  volume: 0.5,
  isShuffled: false,
  repeatMode: "off",
  duration: 0,
  position: 0,
  isLoadingTrack: false,

  // --- [상태 변경 단순 액션들] ---
  setIsLoadingTrack: (loading) => set({ isLoadingTrack: loading }),
  setPlayerInstance: (player) => set({ playerInstance: player }),
  setQueue: (tracks) => {
    set({
      queue: tracks,
      currentIndex: 0,
    });
  },
  setDeviceId: (id) => set({ deviceId: id }),
  setIsReady: (ready) => set({ isReady: ready }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPosition: (pos) => set({ position: pos }),
  setDuration: (dur) => set({ duration: dur }),

  // --- [비즈니스 로직 및 API 통신] ---

  togglePlay: async () => {
    const { isPlaying, playerInstance } = get();
    if (!playerInstance) return;

    // 낙관적 업데이트: UI 먼저 즉각 변경 후 SDK 명령
    set({ isPlaying: !isPlaying });
    await playerInstance.togglePlay();
  },

  nextTrack: async () => {
    const { playerInstance, queue, currentIndex, isShuffled } = get();
    if (!playerInstance || queue.length === 0) return;

    // [FLOW 0] 다음 곡 클릭시 로딩 UI(스피너/닷)
    // set({ isLoadingTrack: true }); ux를 위해 셔플모드에서만

    try {
      if (!isShuffled) {
        // [FLOW 1-A] 일반 모드: 다음 곡이 뭔지 아니까 UI 정보 즉시 변경
        const nextIndex = currentIndex + 1;
        if (nextIndex < queue.length) {
          set({
            currentIndex: nextIndex,
            currentTrack: queue[nextIndex] ?? null,
            position: 0,
            duration: 0,
            isPlaying: true,
          });
        }
      } else {
        // [FLOW 1-B] 셔플 모드: 스포티파이 서버가 무슨 곡을 줄지 모름
        // 앨범 아트는 놔두고 프로그레스 바(position)만 0으로 밀어서 곡이 전환 중임을 암시
        set({ isLoadingTrack: true, position: 0 });
      }

      // [FLOW 2] 스포티파이 서버로 다음 곡 재생 명령 전달 (로딩은 syncStateFromSdk에서 꺼짐)
      await playerInstance.nextTrack();
    } catch (e) {
      console.error("다음 곡 넘기기 실패:", e);
      set({ isLoadingTrack: false });
    }
  },

  prevTrack: async () => {
    const { playerInstance, position, queue, currentIndex, isShuffled } = get();
    if (!playerInstance || queue.length === 0) return;

    if (position > 5000) {
      set({ position: 0 });
      await playerInstance.seek(0);
      return;
    }

    // set({ isLoadingTrack: true });

    try {
      if (!isShuffled) {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          set({
            currentIndex: prevIndex,
            currentTrack: queue[prevIndex] ?? null,
            position: 0,
            duration: 0,
            isPlaying: true,
          });
        }
      } else {
        set({ isLoadingTrack: true, position: 0 });
      }
      await playerInstance.previousTrack();
    } catch (e) {
      console.error("이전 곡 넘기기 실패:", e);
      set({ isLoadingTrack: false });
    }
  },

  seekTo: async (pos) => {
    const { playerInstance } = get();
    if (!playerInstance) return;

    set({ position: pos });
    await playerInstance.seek(pos);
  },

  optimisticPlay: (tracks, index) => {
    set({
      queue: tracks,
      currentIndex: index,
      currentTrack: tracks[index] ?? null,
      isPlaying: true,
    });
  },

  // [SDK 이벤트 리스너] 스포티파이 서버에서 상태 변경 알림이 올 때마다 실행됨 (타 기기에서 변경 대비)
  syncStateFromSdk: (state) => {
    const { currentTrack, queue } = get();
    const sdkTrack = state.track_window.current_track;

    // 곡 정보 동기화 (같은 곡이면 리렌더링 방지)
    if (currentTrack?.id !== sdkTrack.id) {
      const idx = queue.findIndex((t) => t.id === sdkTrack.id);

      set({
        currentIndex: idx >= 0 ? idx : 0,
        currentTrack: mapSdkTrackToLocalTrack(sdkTrack),
      });
    }

    // 셔플/반복 상태 동기화 (외부에서 바꿨을 때 대비)
    const repeatModes: RepeatMode[] = ["off", "context", "track"];

    set({
      isShuffled: state.shuffle,
      repeatMode: repeatModes[state.repeat_mode] ?? "off",
      // [FLOW 4] 서버에서 새 곡 정보를 정상적으로 받아왔으므로 로딩 UI를 끔
      isLoadingTrack: false,
    });
  },

  setVolume: async (val) => {
    const { playerInstance } = get();
    set({ volume: val });

    if (playerInstance) {
      // ux를 위해 playerInstance 없어도 바로 return X
      await playerInstance.setVolume(val);
    }
  },

  toggleShuffle: async (token) => {
    const { isShuffled, deviceId } = get();
    // 셔플, 반복 기능은 sdk가 아닌 web API에서 다루기 때문에
    // playerInstance 아닌 deviceId 필요
    if (!deviceId) return;

    const nextState = !isShuffled;
    set({ isShuffled: nextState });

    try {
      await setShuffle(nextState, deviceId, token);
    } catch (e) {
      console.error("셔플 모드 변경 실패:", e);
      set({ isShuffled: !nextState });
    }
  },

  cycleRepeatMode: async (token) => {
    const { repeatMode, deviceId } = get();
    if (!deviceId) return;

    const modes: RepeatMode[] = ["off", "context", "track"];
    const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
    const nextMode = modes[nextIndex] as RepeatMode;

    set({ repeatMode: nextMode });

    try {
      await setRepeatMode(nextMode, deviceId, token);
    } catch (e) {
      console.error("반복 모드 변경 실패:", e);
      set({ repeatMode });
    }
  },

  playFromPlaylist: async (tracks, startIndex, token) => {
    // 1. get()을 통해 스토어 내부의 현재 상태들을 모두 가져옴
    const {
      deviceId,
      queue,
      currentIndex,
      isPlaying: wasPlaying,
      optimisticPlay,
      setIsPlaying,
      setPosition,
      setDuration,
    } = get();

    if (!deviceId || !token) return;

    // 2. 에러 시 롤백을 위한 상태 백업 (컴포넌트가 아니라 스토어 내부에서 안전하게 저장)
    const previousQueue = queue;
    const previousIndex = currentIndex;
    const previousPlaying = wasPlaying;

    // 3. 낙관적 업데이트 실행
    optimisticPlay(tracks, startIndex);
    const uris = tracks.map((t) => `spotify:track:${t.id}`);

    try {
      // 4. 실제 API 호출
      await startPlayback(uris, deviceId, token, startIndex);
    } catch (error) {
      console.error("재생 요청 실패:", error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const code = error.code;

        // --- 에러 UI 처리 (토스트) ---
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

        // --- 상태 롤백 처리 ---
        if (status === 403 || status === 404) {
          if (previousQueue.length > 0) {
            // 아까 백업해둔 상태로 스토어 자체에서 복구
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
  },
}));
