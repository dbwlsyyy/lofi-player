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

      stopAtEntry: false, // 진입 시 정지 예약 깃발
      setStopAtEntry: (val) => set({ stopAtEntry: val }),

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

        // 사이드바 불빛을 위해 현재 재생할 곡의 키를 저장
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
          // 6. 서버가 상태를 반영할 시간을 벌어준 뒤 방어막 해제
          setTimeout(() => {
            set({ isTransitioning: false });
          }, 1500);
        }
      },

      playSingleTrack: async (track, token) => {
        const { deviceId, playerInstance, setIsPlaying, setPosition, setDuration } = get();

        if (!deviceId || !token) return;

        set({ isTransitioning: true });

        const { queue: currentQueue, currentIndex: currentIdx } = get();
        const rollbackState = {
          queue: [...currentQueue],
          currentIndex: currentIdx,
          isPlaying: get().isPlaying,
        };

        // 1. 새 트랙 생성 및 고유 키 부여
        const newTrackWithKey = { ...track, uniqueKey: crypto.randomUUID() };

        // 2. 새로운 큐 및 삽입 위치 계산
        let newQueue: any[];
        let playIndex: number;

        if (currentQueue.length === 0) {
          newQueue = [newTrackWithKey];
          playIndex = 0;
        } else {
          newQueue = [...currentQueue];
          playIndex = currentIdx + 1;
          newQueue.splice(playIndex, 0, newTrackWithKey);
        }

        // 3. 낙관적 업데이트
        set({
          queue: newQueue,
          currentIndex: playIndex,
          currentTrack: newTrackWithKey,
          activeUniqueKey: newTrackWithKey.uniqueKey,
          isPlaying: true,
          position: 0,
        });

        try {
          // 스포티파이 형식으로 URI 정제
          const uris = newQueue
            .slice(0, 100)
            .map((t) => {
              // 1. 이미 정식 uri가 있다면 그대로 사용
              if (t.uri && t.uri.includes("spotify:track:")) return t.uri;
              // 2. id만 있다면 spotify:track: 붙여줌 (중복 방지 체크)
              const cleanId = t.id.replace("spotify:track:", "");
              return `spotify:track:${cleanId}`;
            })
            .filter(Boolean); // 혹시 모를 null/undefined 제거

          // [방어막] 일시정지 후 서버 상태가 안정될 때까지 대기

          // [최종 확인] uris가 비어있지 않고, 인덱스가 유효할 때만 전송
          if (uris.length > 0 && playIndex < uris.length) {
            await startPlayback(uris, deviceId, token, playIndex);
          }
        } catch (error: any) {
          console.error("playSingleTrack 에러 상세:", error.response?.data || error);

          // 최후의 보루: 현재 물려있는 곡이라도 그냥 재생 시킴
          if (error.response?.status === 400) {
            await playerInstance?.resume();
          } else {
            handlePlaybackError(
              error,
              rollbackState,
              (q, i) => set({ queue: q, currentIndex: i }),
              setIsPlaying,
              setPosition,
              setDuration,
            );
          }
        } finally {
          setTimeout(() => set({ isTransitioning: false }), 1500);
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
          stopAtEntry: false,
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
        const { queue, currentIndex, deviceId, clearQueue } = get();
        if (!token || !deviceId) return;

        // 1. [Clear Queue] 남은 곡이 1개일 때 삭제하면 완전히 초기화
        if (queue.length <= 1) {
          clearQueue();
          return; // 여기서 함수 종료 아래 로직 안 탐
        }

        // 2. 새로운 큐 계산 (로컬에서 즉시 실행)
        const newQueue = queue.filter((_, i) => i !== targetIndex);

        // 3. [Case A] 현재 재생 중인 곡을 삭제하는 경우
        if (targetIndex === currentIndex) {
          // 다음 곡 결정: 마지막 곡이면 0번으로, 아니면 그 자리 그대로
          const nextIndex = targetIndex < newQueue.length ? targetIndex : 0;
          const nextTrack = newQueue[nextIndex];

          // 로컬 상태 먼저 반영
          set({
            queue: newQueue,
            currentIndex: nextIndex,
            currentTrack: nextTrack ?? null,
            activeUniqueKey: nextTrack?.uniqueKey ?? null,
          });

          // 서버에 새로운 리스트를 쏴서 다음 곡으로 강제 전환
          const uris = newQueue.map((t) => `spotify:track:${t.id.replace("spotify:track:", "")}`);
          await startPlayback(uris, deviceId, token, nextIndex);
        }

        // 4. [Case B] 현재 재생 중이 아닌 다른 곡을 삭제하는 경우
        else {
          // 인덱스 보정: 삭제된 곡이 현재 곡보다 앞에 있었다면 현재 인덱스를 하나 당겨줌
          const nextCurrentIndex = targetIndex < currentIndex ? currentIndex - 1 : currentIndex;

          set({
            queue: newQueue,
            currentIndex: nextCurrentIndex,
          });

          console.log("다른 곡 삭제: UI만 업데이트했습니다. 다음 곡 전환 시 싱크가 맞춰집니다.");
        }
      },

      clearQueue: () => {
        set({
          queue: [],
          currentIndex: 0,
        });
      },

      // --- [비즈니스 로직 및 API 통신] ---

      togglePlay: async (token?: string) => {
        const {
          isPlaying,
          playerInstance,
          queue,
          position,
          currentTrack,
          playSingleTrack,
          stopAtEntry,
          deviceId,
          currentIndex,
        } = get();

        if (!playerInstance) return;

        // [낙관적 업데이트]
        set({ isPlaying: !isPlaying });

        try {
          if (isPlaying) {
            // 재생 중이면 멈춤
            await playerInstance.pause();
            return;
          }

          // --- (재생 버튼을 누른 경우) ---

          // [예외] 비우기 상태(queue: [])에서 곡이 끝나 0초에 머물러 있을 때
          if (queue.length === 0 && position === 0 && currentTrack && token) {
            await playSingleTrack(currentTrack, token);
            return;
          }

          // 리스트가 끝나서 0번에서 대기 중(stopAtEntry)일 때
          if (stopAtEntry && token && deviceId) {
            console.log("🔄 재생 버튼 클릭: 밀린 서버 동기화를 진행하며 0번 곡을 틉니다.");

            // 밀린 숙제 해결했으니 깃발 내림 (UI는 위에서 이미 true가 되었으므로 냅둠)

            const uris = queue.map((t) => `spotify:track:${t.id.replace("spotify:track:", "")}`);

            // 단순 resume()이 아니라 서버에 최신 리스트를 쏘면서 재생
            await startPlayback(uris, deviceId, token, currentIndex);
            return;
          }
          set({ stopAtEntry: false });
          // [일반 상황] 평소에는 그냥 resume
          await playerInstance.resume();
        } catch (error) {
          console.error("재생 토글 에러:", error);
          // 에러 나면 UI 원상복구 (낙관적 업데이트 롤백)
          set({ isPlaying });
        }
      },

      nextTrack: async (token?: string, isAuto = false) => {
        const { playerInstance, queue, currentIndex, isShuffled, deviceId, repeatMode } = get();
        if (!playerInstance || queue.length === 0 || !deviceId || !token) return;

        try {
          if (!isShuffled) {
            const nextIndex = currentIndex + 1;
            const uris = queue.map((t) => `spotify:track:${t.id.replace("spotify:track:", "")}`);

            if (nextIndex < queue.length) {
              // [1. 일반 다음 곡]
              set({
                currentIndex: nextIndex,
                currentTrack: queue[nextIndex] ?? null,
                activeUniqueKey: queue[nextIndex]?.uniqueKey ?? null,
                position: 0,
                isPlaying: true,
                isTransitioning: true,
                stopAtEntry: false,
              });
              await startPlayback(uris, deviceId, token, nextIndex);
            } else {
              // [2. 마지막 곡에서 다음으로 넘어갈 때]
              // nextTrack 함수 내부의 마지막 곡(isAuto) 처리 부분
              if (isAuto && repeatMode === "off") {
                set({
                  currentIndex: 0,
                  currentTrack: queue[0] ?? null,
                  activeUniqueKey: queue[0]?.uniqueKey ?? null,
                  position: 0,
                  isPlaying: false,
                  isTransitioning: true, // SDK 이벤트 무시
                  stopAtEntry: true, // 소리 차단용 깃발
                });

                await startPlayback(uris, deviceId, token, 0);

                setTimeout(() => {
                  set({ isTransitioning: false, stopAtEntry: false });
                }, 2000);
              } else {
                // 수동 클릭이거나 반복이 켜져있다면 -> 0번으로 가고 재생
                set({
                  currentIndex: 0,
                  currentTrack: queue[0] ?? null,
                  activeUniqueKey: queue[0]?.uniqueKey ?? null,
                  position: 0,
                  isPlaying: true,
                  isTransitioning: true,
                  stopAtEntry: false,
                });
                await startPlayback(uris, deviceId, token, 0);
              }
            }

            setTimeout(() => set({ isTransitioning: false }), 1500);
          } else {
            // 셔플 모드
            set({ isLoadingTrack: true, position: 0, stopAtEntry: false });
            await playerInstance.nextTrack();
          }
        } catch (e) {
          console.error("다음 곡 넘기기 실패:", e);
          set({ isLoadingTrack: false, isTransitioning: false });
        }
      },

      prevTrack: async () => {
        const { playerInstance, position, queue, currentIndex, isShuffled } = get();
        if (!playerInstance || queue.length === 0) return;
        set({ stopAtEntry: false });
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
      syncStateFromSdk: async (state, token) => {
        const {
          queue,
          currentIndex,
          currentTrack,
          deviceId,
          playerInstance,
          isTransitioning,
          stopAtEntry,
          nextTrack,
        } = get();

        const sdkTrack = state.track_window.current_track;

        if (!token || !deviceId || queue.length === 0 || !sdkTrack) return;

        // 1. [소리 차단기] SDK 상태 묻지도 따지지도 않고 그냥 멈춤
        if (stopAtEntry) {
          playerInstance?.pause();
          return;
        }

        // 2.
        // isTransitioning이 켜져 있는 2초 동안은 스포티파이가 무슨 헛소리를 보내든
        // 여기서 무조건 return 시켜서 아래의 UI 변경 로직(isPlaying)을 절대 못 타게
        if (isTransitioning) {
          set({
            isShuffled: state.shuffle,
            repeatMode: (["off", "context", "track"][state.repeat_mode] as RepeatMode) ?? "off",
            isPlaying: !state.paused,
          });
          return;
        }

        // 3. [유령 트랙 감지]
        if (currentTrack && sdkTrack.id !== currentTrack.id) {
          const expectedNextTrack = queue[currentIndex + 1] ?? queue[0];

          // [공통] 스포티파이가 튼 곡이 큐에 존재하는지 먼저 검사
          const isTrackInQueue = queue.some((t) => t.id === sdkTrack.id);

          // [우선순위 1: 삭제된 유령 곡 검문]
          if (!isTrackInQueue) {
            console.log("👻 큐에 없는 유령 곡 감지");

            const isGoingToZero = expectedNextTrack?.id === queue[0]?.id;

            if (isGoingToZero) {
              console.log("⏹️ 리스트 종료: UI만 0번으로 초기화하고 재생 대기.");
              set({
                currentIndex: 0,
                currentTrack: queue[0] ?? null,
                activeUniqueKey: queue[0]?.uniqueKey ?? null,
                position: 0,
                isPlaying: false,
                stopAtEntry: true,
              });
              return;
            }

            // 중간에 있는 곡이 삭제된 거라면
            else {
              set({ stopAtEntry: true });
              await nextTrack(token, true);
              set({ stopAtEntry: false });

              return;
            }
          }

          // [우선순위 2: 끼워넣은 곡(순서 꼬임) 검문]
          // 큐에 있긴 한데 예상한 바로 다음 곡이 아닐 경우
          if (!state.shuffle && expectedNextTrack && sdkTrack.id !== expectedNextTrack.id) {
            console.log("🔄 끼워넣은 곡 감지. 다음 곡을 덮어씌우ㅁ");

            await nextTrack(token, true);
            return;
          }
        }

        // 4. 정상 상태 동기화
        set((prevState: PlayerState) => {
          let nextIdx = prevState.queue.findIndex(
            (t, i) => t.id === sdkTrack.id && i >= prevState.currentIndex,
          );
          if (nextIdx === -1) nextIdx = prevState.queue.findIndex((t) => t.id === sdkTrack.id);

          const foundInQueue = nextIdx !== -1 ? prevState.queue[nextIdx] : null;
          const finalTrack = foundInQueue ?? mapSdkTrackToLocalTrack(sdkTrack);

          return {
            currentIndex: nextIdx !== -1 ? nextIdx : 0,
            currentTrack: finalTrack ?? null,
            activeUniqueKey: finalTrack?.uniqueKey ?? null,
            isShuffled: state.shuffle,
            repeatMode: (["off", "context", "track"][state.repeat_mode] as RepeatMode) ?? "off",
            isPlaying: !state.paused, // 2초가 지났을 때만 여기서 UI를 업데이트
            isLoadingTrack: false,
          };
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
