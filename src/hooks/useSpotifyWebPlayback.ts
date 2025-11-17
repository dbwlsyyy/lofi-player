'use client';

import { useEffect, useRef } from 'react';
import { loadSpotifySdk } from '@/lib/loadSpotifySdk';
import { usePlayerStore } from '@/store/usePlayerStore';
import { mapSdkTrackToLocalTrack } from '@/lib/spotifyMapper';

export function useSpotifyWebPlayback(accessToken: string | null | undefined) {
    const {
        play,
        pause,
        setDeviceId,
        setIsReady,
        updatePosition,
        updateDuration,
        syncTrackFromSdk,
    } = usePlayerStore();

    const playerRef = useRef<Spotify.Player | null>(null);

    useEffect(() => {
        if (!accessToken) return;

        let cancelled = false;
        let positionTick: ReturnType<typeof setInterval> | null = null;

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

                    // 재생 여부 동기화
                    const isPlaying = !state.paused;
                    const sdkTrack = state.track_window.current_track;

                    if (isPlaying) {
                        play(mapSdkTrackToLocalTrack(sdkTrack));
                    } else {
                        pause();
                    }
                    // 현재 재생 중인 트랙 정보 동기화
                    if (sdkTrack && sdkTrack.id) {
                        syncTrackFromSdk(mapSdkTrackToLocalTrack(sdkTrack));
                    }

                    // 곡 길이, 재생 위치 동기화 (ms)
                    updateDuration(state.duration);
                    updatePosition(state.position);
                });

                positionTick = setInterval(async () => {
                    const state = await player.getCurrentState();
                    if (!state) return;
                    if (state.paused) return;
                    if (state.position < 100) return;
                    updatePosition(state.position);
                }, 500);

                // 연결 시작
                player.connect();
            } catch (err) {
                console.error('Spotify Player Init Error:', err);
            }
        };

        init();

        return () => {
            cancelled = true;
            if (positionTick) clearInterval(positionTick);

            if (playerRef.current) {
                playerRef.current.disconnect();
                playerRef.current = null;
            }
        };
    }, [
        accessToken,
        play,
        pause,
        setDeviceId,
        setIsReady,
        updateDuration,
        updatePosition,
        syncTrackFromSdk,
    ]);
}
