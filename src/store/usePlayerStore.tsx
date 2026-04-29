import { setRepeatMode, setShuffle, startPlayback } from "@/apis/playbackApi";
import { mapSdkTrackToLocalTrack } from "@/lib/spotifyMapper";
import { uiToast } from "@/lib/toasts";
import axios from "axios";
import { FiExternalLink, FiLock, FiWifiOff } from "react-icons/fi";
import { create } from "zustand";
import { PlayerState, RepeatMode } from "@/types/player";
import { createJSONStorage, persist } from "zustand/middleware";

// --- [에러 핸들링 로직 분리] ---
const handlePlaybackError = (
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

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // --- [상태 초기값] ---
      activeUniqueKey: null,
      isTransitioning: false,

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

      setQueueAndPlay: (tracks, index) => {
        set({
          queue: tracks,
          currentIndex: index,
          currentTrack: tracks[index] ?? null,
          isPlaying: true,
        });
      },

      // --- [음악 재생 제어] ---

      // 1. 전체 재생 (덮어쓰기)
      playAllTracks: async (tracks, startIndex, token) => {
        // 1. 필요한 현재 상태들
        const {
          deviceId,
          queue,
          currentIndex,
          isPlaying: wasPlaying,
          setQueueAndPlay,
          setIsPlaying,
          setPosition,
          setDuration,
        } = get();
        if (!deviceId || !token) return;

        // 2. 방어막 가동 & 롤백용 스냅샷 저장
        set({ isTransitioning: true });
        const rollbackState = { queue, currentIndex, isPlaying: wasPlaying };

        // 3. 모든 트랙에 새로운 고유 키(UUID) 부여
        const tracksWithKeys = tracks.map((t) => ({
          ...t,
          uniqueKey: crypto.randomUUID(),
        }));

        // 4. 스토어 상태 업데이트 (큐 교체 + 시작 인덱스 설정)
        setQueueAndPlay(tracksWithKeys, startIndex);

        // [추가] 사이드바 불빛을 위해 현재 재생할 곡의 키를 저장
        set({ activeUniqueKey: tracksWithKeys[startIndex]?.uniqueKey ?? null });

        const uris = tracksWithKeys.map((t) => `spotify:track:${t.id}`);

        try {
          // 5. 실제 재생 명령 (startIndex부터 재생하도록 서버에 전달)
          await startPlayback(uris, deviceId, token, startIndex);
        } catch (error) {
          // 에러 발생 시 기존 롤백 로직 실행
          handlePlaybackError(
            error,
            rollbackState,
            setQueueAndPlay,
            setIsPlaying,
            setPosition,
            setDuration,
          );
        } finally {
          // 6. [추가] 서버가 상태를 반영할 시간을 벌어준 뒤 방어막 해제
          setTimeout(() => {
            set({ isTransitioning: false });
          }, 1500);
        }
      },

      playSingleTrack: async (track, token) => {
        const { deviceId, setIsPlaying, setPosition, setDuration } = get();
        if (!deviceId || !token) return;

        set({ isTransitioning: true });

        // 1. 롤백을 위해 현재 상태 미리 백업 (함수 시작 시점의 스냅샷)
        const rollbackState = {
          queue: get().queue,
          currentIndex: get().currentIndex,
          isPlaying: get().isPlaying,
        };

        // 2. 함수형 업데이트 (set(state => ...)) 사용
        // 이 블록 안에서 state는 무조건 '가장 최신'의 큐 상태임을 보장
        const newTrackWithKey = { ...track, uniqueKey: crypto.randomUUID() };

        set((state) => {
          const newQueue = [...state.queue];
          // 현재 곡 바로 다음 인덱스 계산 (큐가 비었으면 0)
          const nextIndex = newQueue.length > 0 ? state.currentIndex + 1 : 0;
          // 큐에 새 곡 끼워넣기
          newQueue.splice(nextIndex, 0, newTrackWithKey);

          return {
            queue: newQueue,
            currentIndex: nextIndex,
            currentTrack: newTrackWithKey,
            activeUniqueKey: newTrackWithKey.uniqueKey, // UI 동기화를 위한 핵심 키
            isPlaying: true,
            position: 0,
            isLoadingTrack: false,
          };
        });

        // 3. API 요청 준비 (위에서 set으로 바뀐 최신 큐를 다시 get으로 가져옴)
        const { queue, currentIndex } = get();

        // 스포티파이 서버 부하를 줄이기 위해 현재 곡부터 최대 100곡만 잘라서 보냄
        const contextTracks = queue.slice(0, 100);
        const uris = contextTracks.map((t) => `spotify:track:${t.id}`);

        try {
          // 4. 실제 재생 명령 (슬라이스된 배열의 0번째 곡부터 재생)
          await startPlayback(uris, deviceId, token, currentIndex);
        } catch (error) {
          // 5. 실패 시 아까 정의한 헬퍼 함수로 안전하게 롤백
          handlePlaybackError(
            error,
            rollbackState,
            (q, i) => set({ queue: q, currentIndex: i }), // 낙관적 업데이트 롤백용 함수
            setIsPlaying,
            setPosition,
            setDuration,
          );
        } finally {
          // 2. 1.5초 정도 여유를 두고 방어막 해제 (서버가 새 곡 정보를 반영할 시간)
          setTimeout(() => {
            set({ isTransitioning: false });
          }, 1500);
        }
      },

      // 3. 바로 다음에 재생 (재생 없이 큐에 예약만 추가)
      addTrackToNext: (track) => {
        set((state) => {
          // 새 곡에 신분증(UUID) 발급
          const newTrackWithKey = { ...track, uniqueKey: crypto.randomUUID() };
          const newQueue = [...state.queue];

          // 끼워넣을 위치 계산: 현재 곡의 '바로 다음(+1)'
          const insertIndex = state.queue.length > 0 ? state.currentIndex + 1 : 0;
          newQueue.splice(insertIndex, 0, newTrackWithKey);

          // 뒤에 끼워 넣은 거라 currentIndex는 변함없음
          return { queue: newQueue };
        });
      },

      jumpTo: async (index, token) => {
        const { queue, deviceId } = get();
        if (!deviceId || !queue[index]) return;

        // 1. 화면(UI)과 방어막 즉시 업데이트
        set({
          currentIndex: index,
          currentTrack: queue[index],
          activeUniqueKey: queue[index].uniqueKey ?? null,
          isPlaying: true,
          isTransitioning: true, // 낡은 서버 정보 차단용
        });

        // 2. 소리(API) 재생 명령
        const contextTracks = queue.slice(0, 100);
        const uris = contextTracks.map((t) => `spotify:track:${t.id}`);

        try {
          await startPlayback(uris, deviceId, token, index);
        } finally {
          // 1.5초 뒤 서버 동기화 허용
          setTimeout(() => set({ isTransitioning: false }), 1500);
        }
      },

      // --- [큐 사이드바 관리 전용 액션] ---
      removeTrackFromQueue: async (targetIndex, token) => {
        const { queue, currentIndex, jumpTo } = get();

        // 1. 만약 삭제하려는 곡이 '현재 재생 중인 곡'이라면
        if (targetIndex === currentIndex) {
          // 큐에 이 곡 딱 하나뿐이었다면? 큐 비우고 초기화
          if (queue.length === 1) {
            set({
              queue: [],
              currentIndex: 0,
              currentTrack: null,
              activeUniqueKey: null,
              isPlaying: false,
            });
            return;
          }

          // 일단 큐에서 해당 곡을 삭제한 새로운 배열 생성
          const newQueue = queue.filter((_, i) => i !== targetIndex);

          // 다음 곡 결정: 마지막 곡을 삭제했다면 다시 0번으로, 아니면 그 자리에 새로 들어온 곡으로
          const nextIndex = targetIndex < newQueue.length ? targetIndex : 0;

          // [중요] 상태를 먼저 업데이트하여 큐를 줄인 뒤, 재생 함수 호출
          set({ queue: newQueue });

          // playTrackFromQueue가 다음 곡의 불빛(activeUniqueKey)과 스포티파이 재생을 모두 처리해줍니다.
          await jumpTo(nextIndex, token);
        } else {
          // 2. 현재 재생 중이 '아닌' 다른 곡을 삭제하는 경우 (기존 로직 유지)
          set((state) => {
            const newQueue = [...state.queue];
            newQueue.splice(targetIndex, 1);

            let nextCurrentIndex = state.currentIndex;

            // 삭제한 곡이 지금 듣는 곡보다 '앞'에 있었다면 인덱스를 하나 당겨줘야 함
            if (targetIndex < state.currentIndex) {
              nextCurrentIndex -= 1;
            }

            return { queue: newQueue, currentIndex: nextCurrentIndex };
          });
        }
      },

      clearQueue: () => {
        const { currentTrack } = get();
        // 큐를 비워도 현재 나오는 곡은 하나 남기기
        if (currentTrack) {
          set({ queue: [currentTrack], currentIndex: 0 });
        } else {
          set({ queue: [], currentIndex: 0 });
        }
      },

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
                activeUniqueKey: queue[nextIndex]?.uniqueKey ?? null,
                position: 0,
                duration: 0,
                isPlaying: true,
                isTransitioning: true,
              });
              setTimeout(() => set({ isTransitioning: false }), 1500);
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
                activeUniqueKey: queue[prevIndex]?.uniqueKey ?? null,
                position: 0,
                duration: 0,
                isPlaying: true,
                isTransitioning: true,
              });
              setTimeout(() => set({ isTransitioning: false }), 1500);
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

      // [SDK 이벤트 리스너] 스포티파이 서버에서 상태 변경 알림이 올 때마다 실행됨 (타 기기에서 변경 대비)
      syncStateFromSdk: (state) => {
        // 1. 필요한 현재 상태들을 가져옴
        const { isTransitioning, queue, currentIndex, currentTrack } = get();
        const sdkTrack = state.track_window.current_track;

        // [핵심 방어] 곡 전환 중(isTransitioning)일 때는
        // 서버가 보내는 낡은 곡 정보와 인덱스 정보를 무시
        if (isTransitioning) {
          set({
            isShuffled: state.shuffle,
            repeatMode: ["off", "context", "track"][state.repeat_mode] as RepeatMode,
            isPlaying: !state.paused,
            // currentIndex, currentTrack, activeUniqueKey는 건드리지 않음
          });
          return;
        }

        // 2. 곡 정보가 실제로 바뀌었는지 확인 (ID 기준)
        if (currentTrack?.id !== sdkTrack.id) {
          set((prevState) => {
            // [중복 곡 방어] 큐에 같은 곡이 여러 개일 때
            // 현재 인덱스(currentIndex)와 가장 가까운 다음 곡을 먼저 찾음
            let nextIdx = prevState.queue.findIndex(
              (t, i) => t.id === sdkTrack.id && i >= prevState.currentIndex,
            );

            // 만약 뒤쪽에서 못 찾았다면(유저가 강제로 이전 곡으로 돌렸을 때 등) 전체에서 찾음
            if (nextIdx === -1) {
              nextIdx = prevState.queue.findIndex((t) => t.id === sdkTrack.id);
            }

            // 최종적으로 찾은 인덱스와 곡 정보로 업데이트
            const foundTrack = prevState.queue[nextIdx >= 0 ? nextIdx : 0];

            return {
              currentIndex: nextIdx >= 0 ? nextIdx : 0,
              currentTrack: mapSdkTrackToLocalTrack(sdkTrack),
              // activeUniqueKey도 해당 인덱스의 고유 키로 맞춰줌
              activeUniqueKey: foundTrack?.uniqueKey || null,
              isLoadingTrack: false,
            };
          });
        }

        // 3. 곡 정보 외의 공통 상태 동기화 (셔플, 반복, 재생여부 등)
        const repeatModes: RepeatMode[] = ["off", "context", "track"];

        set({
          isShuffled: state.shuffle,
          repeatMode: repeatModes[state.repeat_mode] ?? "off",
          isPlaying: !state.paused,
          isLoadingTrack: false, // 정보가 왔으므로 로딩 해제
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
    }),
    {
      name: "lofi-player-storage", // 로컬 스토리지에 저장될 키 이름
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        activeUniqueKey: state.activeUniqueKey,
      }),
    },
  ),
);
