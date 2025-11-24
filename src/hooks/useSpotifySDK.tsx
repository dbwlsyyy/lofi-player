'use client';

import { useEffect, useRef } from 'react';
import { loadSpotifySdk } from '@/lib/loadSpotifySdk';
import { usePlayerStore } from '@/store/usePlayerStore';
import { transferToDevice } from '@/apis/spotifyPlayerApi';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiLock, FiUserX, FiWifiOff } from 'react-icons/fi';

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

                player.on('initialization_error', (message) => {
                    console.error('player 초기화 실패', message);
                    toast(
                        (t) => (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                }}
                            >
                                <FiWifiOff size="1.6rem" color="#ff5555" />
                                <span>플레이어 연결 실패 (네트워크 확인)</span>
                            </div>
                        ),
                        { className: 'minimal-toast', id: 'init-error' }
                    );
                });

                player.on('authentication_error', ({ message }) => {
                    console.error('인증 실패:', message);
                    toast(
                        (t) => (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                }}
                            >
                                <FiLock size="1.6rem" color="#ff5555" />
                                <span>로그인 세션이 만료되었습니다.</span>
                            </div>
                        ),
                        { className: 'minimal-toast', id: 'auth-error' }
                    );
                });

                player.on('account_error', ({ message }) => {
                    console.error('계정 오류:', message);
                    toast(
                        (t) => (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                }}
                            >
                                <FiUserX size="1.6rem" color="#ff5555" />
                                <span>프리미엄 계정이 필요합니다.</span>
                            </div>
                        ),
                        { className: 'minimal-toast', id: 'account-error' }
                    );
                });

                player.on('playback_error', ({ message }) => {
                    console.error('재생 실패:', message);
                    toast(
                        (t) => (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                }}
                            >
                                <FiAlertCircle size="1.6rem" color="#ff5555" />
                                <span>일시적인 재생 오류가 발생했습니다.</span>
                            </div>
                        ),
                        { className: 'minimal-toast', id: 'playback-error' }
                    );
                });

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
                    console.log('상태:', state.track_window.current_track.name);

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
