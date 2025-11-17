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

    setIsPlaying: (state: boolean) => void;

    setDeviceId: (id: string | null) => void;
    setIsReady: (ready: boolean) => void;
    setQueue: (tracks: Track[]) => void;

    setPosition: (pos: number) => void;
    setDuration: (dur: number) => void;
    syncTrackFromSdk: (track: Track) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null, // 시작 시 재생 중인 곡 없음
    queue: [], // 시작 시 재생 목록 비움
    currentIndex: 0,
    deviceId: null,
    isReady: false,
    isPlaying: false,
    duration: 0,
    position: 0,

    setDeviceId: (id) => set({ deviceId: id }),
    setIsReady: (ready) => set({ isReady: ready }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setQueue: (tracks) => {
        set({
            queue: tracks,
            currentIndex: 0,
        });
    },

    play: () => set({ isPlaying: true }),

    pause: () => set({ isPlaying: false }),

    setPosition: (pos) => set({ position: pos }),
    setDuration: (dur) => set({ duration: dur }),

    syncTrackFromSdk: (track: Track) => {
        //?
        const { queue } = get();
        const idx = queue.findIndex((t) => t.id === track.id);
        set({
            currentIndex: idx >= 0 ? idx : 0,
            currentTrack: track,
            position: 0,
        });
    },
}));
