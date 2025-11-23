'use client';

import { Track, usePlayerStore } from '@/store/usePlayerStore';
import { transferToDevice, startPlayback } from '@/apis/spotifyPlayerApi';

export function usePlayControl() {
    const { deviceId, setQueue } = usePlayerStore();

    const playFromPlaylist = async (
        tracks: Track[],
        startIndex: number,
        token: string
    ) => {
        if (!deviceId || !token) return;

        setQueue(tracks);

        const uris = tracks.map((t) => `spotify:track:${t.id}`);

        await transferToDevice(deviceId, token);
        await startPlayback(uris, deviceId, token, startIndex);
    };

    return { playFromPlaylist };
}
