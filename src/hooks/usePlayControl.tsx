'use client';

import { Track, usePlayerStore } from '@/store/usePlayerStore';
import { startPlayback } from '@/apis/spotifyPlayerApi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiExternalLink, FiLock } from 'react-icons/fi'; // ✨ 아이콘 추가

export function usePlayControl() {
    const {
        deviceId,
        optimisticPlay,
        setIsPlaying,
        queue,
        currentIndex,
        isPlaying,
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
        const previousPlaying = isPlaying;

        optimisticPlay(tracks, startIndex);

        const uris = tracks.map((t) => `spotify:track:${t.id}`);

        try {
            await startPlayback(uris, deviceId, token, startIndex);
        } catch (error) {
            console.error('재생 요청 실패:', error);

            if (axios.isAxiosError(error) && error.response?.status === 403) {
                toast(
                    (t) => (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.2rem',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                }}
                            >
                                <FiLock size="1.6rem" color="#4f7df3c5" />
                                <span>재생 불가 (유해성 콘텐츠)</span>
                            </div>

                            <div
                                style={{
                                    width: '1px',
                                    height: '1.4rem',
                                    background: 'rgba(255, 255, 255, 0.39)',
                                }}
                            ></div>

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
                        position: 'top-center',
                    }
                );

                if (previousQueue.length > 0) {
                    optimisticPlay(previousQueue, previousIndex);

                    setIsPlaying(previousPlaying);
                } else {
                    setIsPlaying(false);
                    setPosition(0);
                    setDuration(0);
                }
            } else {
                toast.error('재생 중 오류가 발생했습니다.');
                setIsPlaying(false);
            }
        }
    };

    return { playFromPlaylist };
}
