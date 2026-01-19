import { setRepeatMode, setShuffle } from '@/apis/spotifyPlayerApi';
import { mapSdkTrackToLocalTrack } from '@/lib/spotifyMapper';
import { create } from 'zustand';

export type Track = {
    id: string;
    name: string;
    artists: string[];
    image: string;
    durationMs: number;
    previewUrl?: string;
};

export type RepeatMode = 'off' | 'context' | 'track';

type PlayerState = {
    playerInstance: Spotify.Player | null;
    currentTrack: Track | null;
    queue: Track[];
    currentIndex: number;

    isReady: boolean;
    deviceId: string | null;
    isPlaying: boolean;

    volume: number;
    isShuffled: boolean;
    repeatMode: RepeatMode;

    position: number;
    duration: number;
    isQueueOpen: boolean;

    setPlayerInstance: (player: Spotify.Player | null) => void;

    optimisticPlay: (tracks: Track[], index: number) => void;
    togglePlay: () => Promise<void>;
    nextTrack: () => Promise<void>;
    prevTrack: () => Promise<void>;
    seekTo: (pos: number) => Promise<void>;

    setVolume: (val: number) => Promise<void>;
    toggleShuffle: (token: string) => Promise<void>;
    cycleRepeatMode: (token: string) => Promise<void>;

    syncStateFromSdk: (state: Spotify.PlaybackState) => void;

    setQueue: (tracks: Track[]) => void;
    toggleQueue: () => void;
    setDeviceId: (id: string | null) => void;
    setIsPlaying: (state: boolean) => void;
    setIsReady: (ready: boolean) => void;
    setPosition: (pos: number) => void;
    setDuration: (dur: number) => void;
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

    volume: 0.5,
    isShuffled: false,
    repeatMode: 'off',

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

    syncStateFromSdk: (state) => {
        const { currentTrack, queue } = get();
        const sdkTrack = state.track_window.current_track;

        // 곡 정보 동기화 (같은 곡이면 리렌더링 방지)
        if (currentTrack?.id !== sdkTrack.id) {
            const idx = queue.findIndex((t) => t.id === sdkTrack.id);

            set({
                currentIndex: idx >= 0 ? idx : 0,
                currentTrack: mapSdkTrackToLocalTrack(sdkTrack),
            });
        }

        // 셔플/반복 상태 동기화 (외부에서 바꿨을 때 대비)
        const repeatModes: RepeatMode[] = ['off', 'context', 'track'];

        set({
            isShuffled: state.shuffle,
            repeatMode: repeatModes[state.repeat_mode] ?? 'off',
        });
    },

    setVolume: async (val) => {
        const { playerInstance } = get();
        set({ volume: val });
        if (playerInstance) {
            await playerInstance.setVolume(val);
        }
    },

    toggleShuffle: async (token) => {
        const { isShuffled, deviceId } = get();
        if (!deviceId) return;

        const nextState = !isShuffled;
        set({ isShuffled: nextState });

        try {
            await setShuffle(nextState, deviceId, token);
        } catch (e) {
            console.error('Shuffle Error:', e);
            set({ isShuffled: !nextState });
        }
    },

    cycleRepeatMode: async (token) => {
        const { repeatMode, deviceId } = get();
        if (!deviceId) return;

        const modes: RepeatMode[] = ['off', 'context', 'track'];
        const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
        const nextMode = modes[nextIndex] as RepeatMode;

        set({ repeatMode: nextMode });

        try {
            await setRepeatMode(nextMode, deviceId, token);
        } catch (e) {
            console.error('Repeat Error:', e);
            set({ repeatMode });
        }
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
