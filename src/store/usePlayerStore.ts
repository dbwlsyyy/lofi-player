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

    play: (track: Track) => void;
    pause: () => void;
    enqueue: (tracks: Track[]) => void;
    next: () => void;
    prev: () => void;

    setDeviceId: (id: string | null) => void;
    setIsReady: (ready: boolean) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null, // 시작 시 재생 중인 곡 없음
    queue: [], // 시작 시 재생 목록 비움
    currentIndex: 0,
    deviceId: null,
    isReady: false,
    isPlaying: false,

    setDeviceId: (id) => set({ deviceId: id }),
    setIsReady: (ready) => set({ isReady: ready }),

    play: (track) => set({ currentTrack: track, isPlaying: true }),

    pause: () => set({ isPlaying: false }),

    enqueue: (tracks) => {
        if (tracks.length === 0) return;

        set({
            queue: tracks,
            currentTrack: tracks[0] ?? null,
            currentIndex: 0,
            isPlaying: true,
        });
    },

    next: () => {
        const { queue, currentTrack } = get();
        if (!currentTrack) return;

        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        if (idx >= 0 && idx < queue.length - 1) {
            set({
                currentTrack: queue[idx + 1] ?? null,
                currentIndex: idx + 1,
                isPlaying: true,
            });
        }
    },

    prev: () => {
        const { queue, currentTrack } = get();
        if (!currentTrack) return;

        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        if (idx > 0) {
            set({
                currentTrack: queue[idx - 1] ?? null,
                currentIndex: idx - 1,
                isPlaying: true,
            });
        }
    },
}));
