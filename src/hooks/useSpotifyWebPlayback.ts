'use client';

import { useEffect, useRef } from 'react';
import { loadSpotifySdk } from '@/lib/loadSpotifySdk';
import { usePlayerStore } from '@/store/usePlayerStore';

export function useSpotifyWebPlayback(accessToken: string | null | undefined) {
    // 왜 토큰의 타입은 string이 아닌 string | null | undefined로 하는지?
    const { play, pause, setDeviceId, setIsReady } = usePlayerStore();

    const playerRef = useRef<Spotify.Player | null>(null);

    useEffect(() => {
        if (!accessToken) return;

        let cancelled = false;

        const init = async () => {
            try {
                await loadSpotifySdk();
                if (cancelled) return;

                const player = new window.Spotify.Player({
                    name: 'Lofi Web Player',
                    getOAuthToken: (cb) => cb(accessToken),
                    volume: 0.5,
                });

                playerRef.current = player;

                player.addListener('ready', ({ device_id }) => {
                    setDeviceId(device_id);
                    setIsReady(true);
                });

                player.addListener('not_ready', () => {
                    setIsReady(false);
                });

                player.addListener('player_state_changed', (state) => {
                    if (!state) return;

                    const isPlaying = !state.paused;

                    const t = state.track_window.current_track;

                    if (isPlaying && t && t.id) {
                        play({
                            id: t.id,
                            name: t.name,
                            artists: t.artists.map((a) => a.name),
                            image: t.album.images[0]?.url ?? '',
                        });
                    } else {
                        pause();
                    }
                });

                player.connect();
            } catch (err) {
                console.error('Spotify Player Init Error:', err);
            }
        };

        init();

        return () => {
            cancelled = true;
            if (playerRef.current) {
                playerRef.current.disconnect();
                playerRef.current = null;
            }
        };
    }, [accessToken, play, pause, setDeviceId, setIsReady]);
}
