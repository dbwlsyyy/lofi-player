import { create } from 'zustand';

// 한 곡(트랙) 타입
export type Track = {
    id: string;
    name: string;
    artists: string[];
    image: string;
    previewUrl?: string;
};

// 플레이어 전체 상태 타입
type PlayerState = {
    currentTrack: Track | undefined;
    queue: Track[];
    isPlaying: boolean;

    // 조작 함수들
    play: (track: Track) => void;
    pause: () => void;
    enqueue: (tracks: Track[]) => void;
    next: () => void;
    prev: () => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: undefined, // 시작 시 재생 중인 곡 없음
    queue: [],
    isPlaying: false,

    play: (track) => set({ currentTrack: track, isPlaying: true }),

    pause: () => set({ isPlaying: false }),

    enqueue: (tracks) => {
        if (tracks.length === 0) return; // 비어 있으면 무시

        set({
            queue: tracks,
            currentTrack: tracks[0],
            isPlaying: true,
        });
    },

    next: () => {
        const { queue, currentTrack } = get();
        if (!currentTrack) return; // 곡이 없으면 무시

        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        if (idx >= 0 && idx < queue.length - 1) {
            set({ currentTrack: queue[idx + 1], isPlaying: true });
        }
    },

    prev: () => {
        const { queue, currentTrack } = get();
        if (!currentTrack) return;

        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        if (idx > 0) {
            set({ currentTrack: queue[idx - 1], isPlaying: true });
        }
    },
}));
