import { PlayerSliceCreator, PlayerStatusSlice } from "@/types/player";

export const createPlayerStatusSlice: PlayerSliceCreator<PlayerStatusSlice> = (set) => ({
  // ---------------------------------------------------------
  // 상태 (State) 초기값 설정
  // ---------------------------------------------------------
  accessToken: null,
  deviceId: null,
  playerInstance: null,
  isReady: false,
  isPlaying: false,
  volume: 0.5,
  isShuffled: false,
  repeatMode: "off",

  // 방어막 및 UI 로딩 상태
  isTransitioning: false,
  stopAtEntry: true,
  isLoadingTrack: false,

  // 재생 진행도
  position: 0,
  duration: 0,

  // ---------------------------------------------------------
  // 단순 변경 액션 (Setter) 모음 - 비동기 로직 없음
  // ---------------------------------------------------------
  setAccessToken: (token) => set({ accessToken: token }),
  setDeviceId: (id) => set({ deviceId: id }),
  setPlayerInstance: (instance) => set({ playerInstance: instance }),
  setIsReady: (isReady) => set({ isReady }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsTransitioning: (isTransitioning) => set({ isTransitioning }),
  setStopAtEntry: (stopAtEntry) => set({ stopAtEntry }),
  setIsLoadingTrack: (isLoadingTrack) => set({ isLoadingTrack }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
});
