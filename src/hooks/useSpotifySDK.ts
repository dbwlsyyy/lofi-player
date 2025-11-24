'use client';

import { useEffect, useRef } from 'react';
import { loadSpotifySdk } from '@/lib/loadSpotifySdk';
import { usePlayerStore } from '@/store/usePlayerStore';
import { mapSdkTrackToLocalTrack } from '@/lib/spotifyMapper';
import { transferToDevice } from '@/apis/spotifyPlayerApi';

export function useSpotifySDK(accessToken: string | null | undefined) {
    const {
        setPlayerInstance,
        setIsPlaying,
        setDeviceId,
        setIsReady,
        setPosition,
        setDuration,
        syncStateFromSdk,
    } = usePlayerStore();

    const playerRef = useRef<Spotify.Player | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!accessToken) return;

        let cancelled = false;

        const stopPolling = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
        };

        const startPolling = () => {
            stopPolling();

            intervalRef.current = setInterval(async () => {
                const player = playerRef.current;
                if (!player) return;

                try {
                    const state = await player.getCurrentState();
                    if (state && !state.loading && !state.paused) {
                        setPosition(state.position);
                        setDuration(state.duration);
                    }
                } catch (err) {
                    console.error('Error getting current state:', err);
                }
            }, 500);
        };

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
                setPlayerInstance(player);

                player.addListener('ready', async ({ device_id }) => {
                    setDeviceId(device_id);
                    setIsReady(true);
                    if (accessToken) {
                        await transferToDevice(device_id, accessToken);
                    }
                });

                player.addListener('not_ready', () => {
                    setIsReady(false);
                });

                player.addListener('player_state_changed', (state) => {
                    console.log(state.track_window.current_track.name);

                    if (!state) {
                        stopPolling();
                        setIsPlaying(false);
                        return;
                    }

                    // 곡 길이, 재생 위치 동기화 (ms)
                    setDuration(state.duration);
                    setPosition(state.position);

                    // 재생 여부 동기화
                    const isPlaying = !state.paused;
                    setIsPlaying(isPlaying);

                    if (!state.loading) {
                        syncStateFromSdk(state); // 현재 재생 중인 트랙 정보 동기화
                        setIsPlaying(isPlaying);
                    }

                    if (isPlaying) startPolling();
                    else stopPolling();
                });

                player.connect();
            } catch (err) {
                console.error('Spotify Player Init Error:', err);
            }
        };

        init();

        return () => {
            cancelled = true;
            stopPolling();
            if (playerRef.current) {
                playerRef.current.disconnect();
            }
            setPlayerInstance(null);
        };
    }, [
        accessToken,
        setPlayerInstance,
        setIsPlaying,
        setDeviceId,
        setIsReady,
        setDuration,
        setPosition,
        syncStateFromSdk,
    ]);
}
