// 스포티파이 곡(Track), 재생 상태 등 도메인 관련 타입

export type Track = {
  id: string;
  name: string;
  artists: string[];
  image: string;
  durationMs: number;
  uri: string;
  previewUrl?: string;
  uniqueKey?: string;
};

export type RepeatMode = "off" | "context" | "track";

export type PlayerState = {
  activeUniqueKey: string | null;
  isTransitioning: boolean;

  playerInstance: Spotify.Player | null;
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;

  isReady: boolean; // Spotify SDK ready
  deviceId: string | null;
  isPlaying: boolean;

  isLoadingTrack: boolean; // 곡 정보 불러오기 중
  setIsLoadingTrack: (loading: boolean) => void;

  volume: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;

  position: number;
  duration: number;

  stopAtEntry: boolean;
  setStopAtEntry: (val: boolean) => void;

  setPlayerInstance: (player: Spotify.Player | null) => void;

  setQueueAndPlay: (tracks: Track[], index: number) => void;

  playAllTracks: (tracks: any[], startIndex: number, token: string) => Promise<void>;
  playSingleTrack: (track: any, token: string) => Promise<void>;
  addTrackToNext: (track: any) => void;
  jumpTo: (index: number, token: string) => Promise<void>;

  removeTrackFromQueue: (index: number, token: string) => void;
  clearQueue: () => void;

  togglePlay: (token?: string) => Promise<void>;
  nextTrack: (token?: string, isAuto?: boolean) => Promise<void>;
  prevTrack: () => Promise<void>;
  seekTo: (pos: number) => Promise<void>;

  setVolume: (val: number) => Promise<void>;
  toggleShuffle: (token: string) => Promise<void>;
  cycleRepeatMode: (token: string) => Promise<void>;

  syncStateFromSdk: (state: Spotify.PlaybackState, token?: string) => void;

  setQueue: (tracks: Track[]) => void;
  setDeviceId: (id: string | null) => void;
  setIsPlaying: (state: boolean) => void;
  setIsReady: (ready: boolean) => void;
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
};
