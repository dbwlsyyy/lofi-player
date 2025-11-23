'use client';

import { Track, usePlayerStore } from '@/store/usePlayerStore';
import { startPlayback } from '@/apis/spotifyPlayerApi';

export function usePlayControl() {
    const { deviceId, optimisticPlay } = usePlayerStore();

    const playFromPlaylist = async (
        tracks: Track[],
        startIndex: number,
        token: string
    ) => {
        if (!deviceId || !token) return;

        optimisticPlay(tracks, startIndex);

        const uris = tracks.map((t) => `spotify:track:${t.id}`);
        await startPlayback(uris, deviceId, token, startIndex);
    };

    return { playFromPlaylist };
}
