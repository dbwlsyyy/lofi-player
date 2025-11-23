import { create } from 'zustand';

export type Track = {
    id: string;
    name: string;
    artists: string[];
    image: string;
    previewUrl?: string;
};

type PlayerState = {
    playerInstance: Spotify.Player | null;
    currentTrack: Track | null;
    queue: Track[];
    currentIndex: number;

    isReady: boolean;
    deviceId: string | null;
    isPlaying: boolean;

    position: number;
    duration: number;
    isQueueOpen: boolean;

    setPlayerInstance: (player: Spotify.Player) => void;

    optimisticPlay: (tracks: Track[], index: number) => void;
    togglePlay: () => Promise<void>;
    nextTrack: () => Promise<void>;
    prevTrack: () => Promise<void>;
    seekTo: (pos: number) => Promise<void>;

    setQueue: (tracks: Track[]) => void;
    toggleQueue: () => void;
    setDeviceId: (id: string | null) => void;
    setIsPlaying: (state: boolean) => void;
    setIsReady: (ready: boolean) => void;
    setPosition: (pos: number) => void;
    setDuration: (dur: number) => void;
    syncTrackFromSdk: (track: Track) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
    playerInstance: null,
    currentTrack: null,
    queue: [],
    currentIndex: 0,
    deviceId: null,
    isReady: false,
    isPlaying: false,
    isQueueOpen: false,
    duration: 0,
    position: 0,

    setPlayerInstance: (player) => set({ playerInstance: player }),

    togglePlay: async () => {
        const { isPlaying, playerInstance } = get();
        if (!playerInstance) return;

        set({ isPlaying: !isPlaying });
        await playerInstance.togglePlay();
    },

    nextTrack: async () => {
        const { playerInstance, queue, currentIndex } = get();
        if (!playerInstance || queue.length === 0) return;

        const nextIndex = currentIndex + 1;
        const nextTrack = queue[nextIndex] ?? null;

        if (nextIndex < queue.length) {
            set({
                currentIndex: nextIndex,
                currentTrack: nextTrack,
                position: 0,
                duration: 0,
                isPlaying: true,
            });
        } // queue의 끝이면?

        await playerInstance.nextTrack();
    },

    prevTrack: async () => {
        const { playerInstance, position, queue, currentIndex } = get();
        if (!playerInstance || queue.length === 0) return;

        if (position > 5000) {
            set({ position: 0 });
            await playerInstance.seek(0);
            return;
        }

        const prevIndex = currentIndex - 1;
        const prevTrack = queue[prevIndex] ?? null;

        if (prevIndex >= 0) {
            set({
                currentIndex: prevIndex,
                currentTrack: prevTrack,
                position: 0,
                duration: 0,
                isPlaying: true,
            });
        }

        await playerInstance.previousTrack();
    },

    seekTo: async (pos) => {
        const { playerInstance } = get();
        if (!playerInstance) return;

        set({ position: pos });
        await playerInstance.seek(pos);
    },

    optimisticPlay: (tracks, index) => {
        const trackToPlay = tracks[index] ?? null;
        set({
            queue: tracks,
            currentIndex: index,
            currentTrack: trackToPlay,
            isPlaying: true,
        });
    },

    syncTrackFromSdk: (sdkTrack) => {
        const { currentTrack, queue } = get();

        if (currentTrack?.id === sdkTrack.id) {
            return;
        }

        const idx = queue.findIndex((t) => t.id === sdkTrack.id);
        set({
            currentIndex: idx >= 0 ? idx : 0,
            currentTrack: sdkTrack,
        });
    },

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
    setDeviceId: (id) => set({ deviceId: id }),
    setIsReady: (ready) => set({ isReady: ready }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setPosition: (pos) => set({ position: pos }),
    setDuration: (dur) => set({ duration: dur }),
}));
