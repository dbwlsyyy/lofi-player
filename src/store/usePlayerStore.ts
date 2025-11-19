import { create } from 'zustand';

export type Track = {
    id: string;
    name: string;
    artists: string[];
    image: string;
    previewUrl?: string;
};

type PlayerState = {
    currentTrack: Track | null;
    queue: Track[];
    deviceId: string | null;
    isReady: boolean;
    isPlaying: boolean;
    currentIndex: number;
    duration: number;
    position: number;
    isQueueOpen: boolean;

    prev: () => void;

    sdkTogglePlay: () => void;
    sdkNextTrack: () => void;
    sdkPrevTrack: () => void;
    sdkSeek: (pos: number) => void;

    setIsPlaying: (state: boolean) => void;
    setDeviceId: (id: string | null) => void;
    setIsReady: (ready: boolean) => void;
    setQueue: (tracks: Track[]) => void;

    toggleQueue: () => void;

    setPosition: (pos: number) => void;
    setDuration: (dur: number) => void;

    syncTrackFromSdk: (track: Track) => void;
    setSdkTogglePlay: (toggleFn: () => void) => void;
    setSdkNextTrack: (nextFn: () => void) => void;
    setSdkPrevTrack: (prevFn: () => void) => void;
    setSdkSeek: (seekFn: (pos: number) => void) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null, // 시작 시 재생 중인 곡 없음
    queue: [], // 시작 시 재생 목록 비움
    currentIndex: 0,
    deviceId: null,
    isReady: false,
    isPlaying: false,
    isQueueOpen: true,
    duration: 0,
    position: 0,

    prev: () => {
        const { position, sdkPrevTrack, sdkSeek } = get();

        if (position < 5000) {
            sdkPrevTrack();
        } else {
            sdkSeek(0);
        }
    },

    sdkTogglePlay: () => {},
    sdkNextTrack: () => {},
    sdkPrevTrack: () => {},
    sdkSeek: (pos) => {},

    setDeviceId: (id) => set({ deviceId: id }),
    setIsReady: (ready) => set({ isReady: ready }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setQueue: (tracks) => {
        set({
            queue: tracks,
            currentIndex: 0,
        });
    },

    toggleQueue: () =>
        set((state) => ({
            isQueueOpen: !state.isQueueOpen,
        })),

    setPosition: (pos) => set({ position: pos }),
    setDuration: (dur) => set({ duration: dur }),

    syncTrackFromSdk: (track: Track) => {
        const { queue } = get();
        const idx = queue.findIndex((t) => t.id === track.id);
        set({
            currentIndex: idx >= 0 ? idx : 0,
            currentTrack: track,
        });
    },

    setSdkTogglePlay: (toggleFn) => set({ sdkTogglePlay: toggleFn }),
    setSdkNextTrack: (nextFn) => set({ sdkNextTrack: nextFn }),
    setSdkPrevTrack: (prevFn) => set({ sdkPrevTrack: prevFn }),
    setSdkSeek: (seekFn) => set({ sdkSeek: seekFn }),
}));
