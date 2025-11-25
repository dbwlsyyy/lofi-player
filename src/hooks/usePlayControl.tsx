'use client';

import { Track, usePlayerStore } from '@/store/usePlayerStore';
import { startPlayback } from '@/apis/spotifyPlayerApi';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    FiExternalLink,
    FiLock,
    FiWifiOff,
    FiAlertCircle,
    FiUserX,
    FiAlertTriangle,
} from 'react-icons/fi';

export function usePlayControl() {
    const {
        deviceId,
        optimisticPlay,
        setIsPlaying,
        queue,
        currentIndex,
        isPlaying: wasPlaying,
        setPosition,
        setDuration,
    } = usePlayerStore();

    const playFromPlaylist = async (
        tracks: Track[],
        startIndex: number,
        token: string
    ) => {
        if (!deviceId || !token) return;

        const previousQueue = queue;
        const previousIndex = currentIndex;
        const previousPlaying = wasPlaying;

        optimisticPlay(tracks, startIndex);
        const uris = tracks.map((t) => `spotify:track:${t.id}`);

        try {
            await startPlayback(uris, deviceId, token, startIndex);
        } catch (error) {
            console.error('재생 요청 실패:', error);

            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const code = error.code;

                if (status === 403) {
                    toast(
                        (t) => (
                            <div className="toast-content">
                                <div className="toast-message">
                                    <FiLock size="1.6rem" color="#4f7df3c5" />
                                    <span>재생 불가 (유해성 콘텐츠)</span>
                                </div>
                                <div className="toast-divider"></div>
                                <a
                                    href="https://open.spotify.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="icon-btn"
                                    onClick={() => toast.dismiss(t.id)}
                                    title="스포티파이 웹에서 인증하기"
                                >
                                    <FiExternalLink size="1.4rem" />
                                </a>
                            </div>
                        ),
                        {
                            className: 'minimal-toast',
                            duration: 4000,
                            id: '403-error',
                        }
                    );
                }
                // 🔍 2. 기기 없음 (404)
                else if (status === 404) {
                    toast(
                        (t) => (
                            <div className="toast-message">
                                <FiAlertCircle size="1.6rem" color="#ff5555" />
                                <span>
                                    플레이어가 비활성화되었습니다. 새로고침
                                    해주세요.
                                </span>
                            </div>
                        ),
                        { className: 'minimal-toast', id: 'device-404' }
                    );
                }
                // 👤 3. 인증 만료 (401)
                else if (status === 401) {
                    toast(
                        (t) => (
                            <div className="toast-message">
                                <FiUserX size="1.6rem" color="#ff5555" />
                                <span>
                                    인증이 만료되었습니다. 다시 로그인해주세요.
                                </span>
                            </div>
                        ),
                        { className: 'minimal-toast', id: 'auth-error' }
                    );
                } else if (
                    code === 'ERR_NETWORK' ||
                    error.message === 'Network Error'
                ) {
                    toast(
                        (t) => (
                            <div className="toast-message">
                                <FiWifiOff size="1.6rem" color="#ff5555" />
                                <span>네트워크 연결이 불안정합니다.</span>
                            </div>
                        ),
                        { className: 'minimal-toast', id: 'net-error' }
                    );
                } else {
                    toast(
                        (t) => (
                            <div className="toast-message">
                                <FiAlertTriangle
                                    size="1.6rem"
                                    color="#ff5555"
                                />
                                <span>
                                    일시적인 오류가 발생했습니다.{' '}
                                    {status
                                        ? `(
                                    ${status})`
                                        : null}
                                </span>
                            </div>
                        ),
                        { className: 'minimal-toast', id: `error-${status}` }
                    );
                }

                if (
                    status === 403 ||
                    status === 404 ||
                    code === 'ERR_NETWORK'
                ) {
                    if (previousQueue.length > 0) {
                        optimisticPlay(previousQueue, previousIndex);
                        setIsPlaying(previousPlaying);
                    } else {
                        setIsPlaying(false);
                        setPosition(0);
                        setDuration(0);
                    }
                } else {
                    setIsPlaying(false);
                }
            } else {
                toast(
                    (t) => (
                        <div className="toast-message">
                            <FiAlertTriangle size="1.6rem" color="#ff5555" />
                            <span>
                                알 수 없는 오류가 발생했습니다. 새로고침
                                해주세요.
                            </span>
                        </div>
                    ),
                    { className: 'minimal-toast' }
                );
                setIsPlaying(false);
            }
        }
    };

    return { playFromPlaylist };
}
