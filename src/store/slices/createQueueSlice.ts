import { startPlayback } from "@/apis/playbackApi";
import { PlayerSliceCreator, QueueSlice } from "@/types/player";

export const createQueueSlice: PlayerSliceCreator<QueueSlice> = (set, get) => ({
  // ---------------------------------------------------------
  // 상태 (State) 초기값
  // ---------------------------------------------------------
  queue: [],
  currentIndex: 0,
  currentTrack: null,
  activeUniqueKey: null,

  // ---------------------------------------------------------
  // 큐 조작 액션 (Actions) - 순수 로컬 데이터 연산
  // ---------------------------------------------------------

  // 1. 큐 비우기
  clearQueue: () => {
    set({
      queue: [],
      currentIndex: 0,
    });
  },

  // 2. 바로 다음에 재생 (재생 없이 큐에 예약만 추가)
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

  // 3. 특정 인덱스의 곡 삭제
  removeTrackFromQueue: async (targetIndex) => {
    const { accessToken, queue, currentIndex, deviceId, clearQueue } = get();
    if (!accessToken || !deviceId) return;

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
      await startPlayback(uris, deviceId, accessToken, nextIndex);
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
});
