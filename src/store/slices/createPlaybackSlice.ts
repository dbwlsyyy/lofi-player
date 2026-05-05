import { setRepeatMode, setShuffle, startPlayback } from "@/apis/playbackApi";
import { PlayerSliceCreator, PlaybackSlice, RepeatMode } from "@/types/player";
import { Track } from "@/types/domainTypes";
import { handlePlaybackError } from "../utils/errorHandlers";
import { mapSpotifySdkTrackToTrack } from "@/lib/spotifyMapper";

export const createPlaybackSlice: PlayerSliceCreator<PlaybackSlice> = (set, get) => ({
  // ---------------------------------------------------------
  // 1. 기본 재생 제어 로직
  // ---------------------------------------------------------

  seekTo: async (pos) => {
    const { playerInstance } = get();
    if (!playerInstance) return;

    set({ position: pos });
    await playerInstance.seek(pos);
  },

  // [SDK 이벤트 리스너] 스포티파이 서버에서 상태 변경 알림이 올 때마다 실행됨 (타 기기에서 변경 대비)

  setVolume: async (val) => {
    const { playerInstance } = get();
    set({ volume: val });

    if (playerInstance) {
      // ux를 위해 playerInstance 없어도 바로 return X
      await playerInstance.setVolume(val);
    }
  },

  setQueueAndPlay: (tracks, index) => {
    set({
      queue: tracks,
      currentIndex: index,
      currentTrack: tracks[index] ?? null,
      isPlaying: true,
    });
  },

  togglePlay: async () => {
    const {
      accessToken,
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
    set({ isPlaying: !isPlaying, stopAtEntry: false });

    try {
      if (isPlaying) {
        // 재생 중이면 멈춤
        await playerInstance.pause();
        return;
      }

      // --- (재생 버튼을 누른 경우) ---

      // [예외] 비우기 상태(queue: [)에서 곡이 끝나 0초에 머물러 있을 때
      if (queue.length === 0 && position === 0 && currentTrack && accessToken) {
        await playSingleTrack(currentTrack);
        return;
      }

      // 리스트가 끝나서 0번에서 대기 중(stopAtEntry)일 때
      if (stopAtEntry && accessToken && deviceId) {
        console.log("🔄 재생 버튼 클릭: 밀린 서버 동기화를 진행하며 0번 곡을 틉니다.");

        const uris = queue.map((t) => `spotify:track:${t.id.replace("spotify:track:", "")}`);

        // 단순 resume()이 아니라 서버에 최신 리스트를 쏘면서 재생
        await startPlayback(uris, deviceId, accessToken, currentIndex);
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

  nextTrack: async (isAuto = false) => {
    const { accessToken, playerInstance, queue, currentIndex, isShuffled, deviceId, repeatMode } =
      get();
    if (!playerInstance || queue.length === 0 || !deviceId || !accessToken) return;

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
          });
          await startPlayback(uris, deviceId, accessToken, nextIndex);
          setTimeout(() => {
            set({ isTransitioning: false, stopAtEntry: false });
          }, 2000);
        } else {
          // [2. 마지막 곡에서 다음으로 넘어갈 때]
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

            await startPlayback(uris, deviceId, accessToken, 0);

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
            await startPlayback(uris, deviceId, accessToken, 0);
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
    const { accessToken, playerInstance, position, queue, deviceId, currentIndex, isShuffled } =
      get();
    if (!playerInstance || queue.length === 0 || !deviceId || !accessToken) return;

    if (position > 5000) {
      set({ position: 0 });
      await playerInstance.seek(0);
      return;
    }

    try {
      if (!isShuffled) {
        const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
        set({
          currentIndex: prevIndex,
          currentTrack: queue[prevIndex] ?? null,
          activeUniqueKey: queue[prevIndex]?.uniqueKey ?? null,
          position: 0,
          duration: 0,
          isPlaying: true,
          isTransitioning: true,
          stopAtEntry: false,
        });

        const uris = queue.map((t) => `spotify:track:${t.id.replace("spotify:track:", "")}`);
        await startPlayback(uris, deviceId, accessToken, prevIndex);

        setTimeout(() => set({ isTransitioning: false }), 1500);
      } else {
        set({ isLoadingTrack: true, position: 0 });
        await playerInstance.previousTrack();
      }
    } catch (e) {
      console.error("이전 곡 넘기기 실패:", e);
      set({ isLoadingTrack: false });
    }
  },

  jumpTo: async (index) => {
    const { accessToken, queue, deviceId } = get();
    if (!deviceId || !queue[index] || !accessToken) return;

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
    // 안전한 처리
    const uris = queue.map((t) => `spotify:track:${t.id.replace("spotify:track:", "")}`);
    try {
      await startPlayback(uris, deviceId, accessToken, index);
    } finally {
      // 1.5초 뒤 서버 동기화 허용
      setTimeout(() => set({ isTransitioning: false }), 1500);
    }
  },

  playAllTracks: async (tracks, startIndex) => {
    // 1. 필요한 현재 상태들
    const {
      accessToken,
      deviceId,
      queue,
      currentIndex,
      isPlaying: wasPlaying,
      setQueueAndPlay,
      setIsPlaying,
      setPosition,
      setDuration,
    } = get();
    if (!deviceId || !accessToken) return;

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
      await startPlayback(uris, deviceId, accessToken, startIndex);
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

  playSingleTrack: async (track) => {
    const { accessToken, deviceId, playerInstance, setIsPlaying, setPosition, setDuration } = get();

    if (!deviceId || !accessToken) return;

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
    let newQueue: Track[];
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
      stopAtEntry: false,
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

      // [최종 확인] uris가 비어있지 않고, 인덱스가 유효할 때만 전송
      if (uris.length > 0 && playIndex < uris.length) {
        await startPlayback(uris, deviceId, accessToken, playIndex);
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

  // ---------------------------------------------------------
  // 2. 외부 통신 제어 로직
  // ---------------------------------------------------------
  toggleShuffle: async () => {
    const { accessToken, isShuffled, deviceId } = get();
    // 셔플, 반복 기능은 sdk가 아닌 web API에서 다루기 때문에
    // playerInstance 아닌 deviceId 필요
    if (!deviceId || !accessToken) return;

    const nextState = !isShuffled;
    set({ isShuffled: nextState });

    try {
      await setShuffle(nextState, deviceId, accessToken);
    } catch (e) {
      console.error("셔플 모드 변경 실패:", e);
      set({ isShuffled: !nextState });
    }
  },

  cycleRepeatMode: async () => {
    const { accessToken, repeatMode, deviceId } = get();
    if (!deviceId || !accessToken) return;

    const modes: RepeatMode[] = ["off", "context", "track"];
    const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
    const nextMode = modes[nextIndex] as RepeatMode;

    set({ repeatMode: nextMode });

    try {
      await setRepeatMode(nextMode, deviceId, accessToken);
    } catch (e) {
      console.error("반복 모드 변경 실패:", e);
      set({ repeatMode });
    }
  },

  // ---------------------------------------------------------
  // 3. SDK 상태 동기화 및 방어막
  // ---------------------------------------------------------
  syncStateFromSdk: async (state) => {
    const store = get();

    const sdkTrack = state.track_window.current_track;

    if (!store.accessToken || !store.deviceId || !sdkTrack) return;

    if (store.stopAtEntry) {
      store.playerInstance?.pause();
      return;
    }

    if (store.isTransitioning) {
      set({
        isShuffled: state.shuffle,
        repeatMode:
          (["off", "context", "track"][state.repeat_mode] as "off" | "context" | "track") ?? "off",
      });
      return;
    }

    // 유령 트랙 및 비우기 감지 로직
    if (store.currentTrack && sdkTrack.id !== store.currentTrack.id) {
      const expectedNextTrack = store.queue[store.currentIndex + 1] ?? store.queue[0];
      const isTrackInQueue = store.queue.some((t) => t.id === sdkTrack.id);
      console.log("⏹️ 유령 트랙 및 비우기 감지");

      if (!isTrackInQueue) {
        // [버그 2 수정] 큐가 아예 비워졌거나, (반복 모드가 꺼져있는데) 리스트의 끝에 도달한 경우에만 멈춤
        console.log("⏹️ 큐기 비워졌거나 리스트 끝");

        const isEmpty = store.queue.length === 0;
        const isListEnded =
          expectedNextTrack?.id === store.queue[0]?.id && store.repeatMode === "off";

        if (isEmpty || isListEnded) {
          console.log("⏹️ 리스트 종료/비우기 감지: UI 0번 초기화 및 재생 대기");
          set({
            currentIndex: 0,
            currentTrack: store.queue[0] ?? null,
            activeUniqueKey: store.queue[0]?.uniqueKey ?? null,
            position: 0,
            isPlaying: false,
            stopAtEntry: true,
          });
          return;
        } else {
          // [버그 1 수정] 삭제된 곡(유령 트랙) 재생 시도 감지
          console.log("👻 유령 트랙 감지: 즉시 오디오를 차단하고 다음 곡으로 스킵");

          // 서버 통신(nextTrack)하는 동안 소리가 새어나오지 않게 즉시 pause로 입을 틀어막습니다.
          store.playerInstance?.pause();

          set({ stopAtEntry: true, isTransitioning: true });
          await store.nextTrack(true);
          set({ stopAtEntry: false, isTransitioning: false });
          return;
        }
      }

      // 순서 꼬임 감지
      if (!state.shuffle && expectedNextTrack && sdkTrack.id !== expectedNextTrack.id) {
        console.log("🔄 순서 불일치 감지: 지연된 변경사항 서버 반영");
        set({ isPlaying: true });
        await store.nextTrack(true);
        return;
      }
    }

    // 정상 상태 동기화
    set((prevState: any) => {
      let nextIdx = prevState.queue.findIndex(
        (t: Track, i: number) => t.id === sdkTrack.id && i >= prevState.currentIndex,
      );
      if (nextIdx === -1) nextIdx = prevState.queue.findIndex((t: any) => t.id === sdkTrack.id);

      const foundInQueue = nextIdx !== -1 ? prevState.queue[nextIdx] : null;
      const finalTrack = foundInQueue ?? mapSpotifySdkTrackToTrack(sdkTrack); // 기존 유틸 함수 유지

      return {
        currentIndex: nextIdx !== -1 ? nextIdx : 0,
        currentTrack: finalTrack ?? null,
        activeUniqueKey: finalTrack?.uniqueKey ?? null,
        isShuffled: state.shuffle,
        repeatMode:
          (["off", "context", "track"][state.repeat_mode] as "off" | "context" | "track") ?? "off",
        isPlaying: !state.paused,
        isLoadingTrack: false,
      };
    });
  },
});
