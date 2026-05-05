import { StateCreator } from "zustand";
import { Track } from "./domainTypes";

export type RepeatMode = "off" | "context" | "track";

// ---------------------------------------------------------
// 1. Player Status Slice: 플레이어의 현재 상태 및 단순 Setter 모음
// ---------------------------------------------------------
export interface PlayerStatusSlice {
  accessToken: string | null;
  deviceId: string | null;
  playerInstance: Spotify.Player | null;
  isReady: boolean;
  isPlaying: boolean;
  volume: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;

  // 방어막 및 UI 상태
  isTransitioning: boolean;
  stopAtEntry: boolean;
  isLoadingTrack: boolean;

  // 재생 진행도
  position: number;
  duration: number;

  // 단순 변경 액션들 (비동기 X)
  setAccessToken: (token: string | null) => void;
  setDeviceId: (id: string | null) => void;
  setPlayerInstance: (instance: Spotify.Player | null) => void;
  setIsReady: (isReady: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsTransitioning: (isTransitioning: boolean) => void;
  setStopAtEntry: (stopAtEntry: boolean) => void;
  setIsLoadingTrack: (isLoadingTrack: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
}

// ---------------------------------------------------------
// 2. Queue Slice: 로컬 재생목록(큐) 상태 및 조작 액션
// ---------------------------------------------------------
export interface QueueSlice {
  queue: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  activeUniqueKey: string | null;

  clearQueue: () => void;
  addTrackToNext: (track: Track) => void;
  removeTrackFromQueue: (targetIndex: number) => void;
}

// ---------------------------------------------------------
// 3. Playback Slice: 핵심 비즈니스 로직 (재생 제어 및 스포티파이 통신)
// ---------------------------------------------------------
export interface PlaybackSlice {
  togglePlay: () => Promise<void>;
  nextTrack: (isAuto?: boolean) => Promise<void>;
  prevTrack: () => Promise<void>;
  jumpTo: (index: number) => Promise<void>;
  playSingleTrack: (track: Track) => Promise<void>;
  playAllTracks: (tracks: Track[], startIndex: number) => Promise<void>;

  // 💡 방금 PlaybackSlice로 이사 온 4인방!
  setQueueAndPlay: (tracks: Track[], index: number) => void;

  seekTo: (pos: number) => Promise<void>;
  setVolume: (val: number) => Promise<void>;
  syncStateFromSdk: (state: Spotify.PlaybackState) => Promise<void>;

  toggleShuffle: () => Promise<void>;
  cycleRepeatMode: () => Promise<void>;
}

// ---------------------------------------------------------
// 전체 스토어 타입 및 슬라이스 생성자 타입
// ---------------------------------------------------------
export type PlayerStoreState = PlayerStatusSlice & QueueSlice & PlaybackSlice;

export type PlayerSliceCreator<T> = StateCreator<
  PlayerStoreState,
  [["zustand/persist", unknown]],
  [],
  T
>;
