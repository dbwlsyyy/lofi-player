'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';
import styles from './SongDetail.module.css';
import {
    FaChevronDown,
    FaPlay,
    FaPause,
    FaStepForward,
    FaStepBackward,
    FaRandom,
    FaRetweet,
} from 'react-icons/fa';
import { formatTime } from '@/lib/formatTime'; // 이미 가지고 계신 유틸 함수

export default function SongDetailPage() {
    const router = useRouter();
    const [isClosing, setIsClosing] = useState(false); // 닫힘 상태 관리
    // 스토어에서 모든 상태와 액션을 직접 가져옵니다.
    const {
        currentTrack,
        isPlaying,
        position,
        duration,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        isShuffled,
        repeatMode,
        toggleShuffle,
        cycleRepeatMode,
    } = usePlayerStore();

    // 현재 세션 토큰 (셔플/반복 모드 변경 시 필요)
    // 실제 환경에서는 useSession 등에서 가져온 token을 넘겨야 합니다.
    const token = '';

    if (!currentTrack) return null;

    const handleClose = () => {
        setIsClosing(true);
        // 애니메이션 지속 시간(0.5s) 후에 실제로 뒤로 가기 실행
        setTimeout(() => {
            router.back();
        }, 300);
    };

    // 프로그레스 바 진행도 계산: (현재위치 / 전체길이) * 100
    // $$ \text{Progress} (\%) = \left( \frac{\text{position}}{\text{duration}} \right) \times 100 $$
    const progressPercent = (position / duration) * 100 || 0;

    // 프로그레스 바 클릭 시 해당 위치로 이동
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newPosition = (clickX / width) * duration;
        seekTo(newPosition);
    };

    return (
        <main
            className={`${styles.container} ${isClosing ? styles.closing : ''}`}
        >
            {/* 다이내믹 배경 */}
            <div
                className={styles.dynamicBg}
                style={{ backgroundImage: `url(${currentTrack.image})` }}
            />
            <div className={styles.overlay} />

            <div className={styles.content}>
                <header className={styles.header}>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <FaChevronDown />
                    </button>
                </header>

                <div className={styles.mainVisual}>
                    {/* 앨범 아트 */}
                    <div className={styles.albumWrapper}>
                        <img
                            src={currentTrack.image}
                            alt={currentTrack.name}
                            className={`${styles.albumArt} ${isPlaying ? styles.playing : ''}`}
                        />
                    </div>

                    {/* 곡 정보 및 플레이어 */}
                    <div className={styles.playerInfo}>
                        <div className={styles.songMeta}>
                            <h1 className={styles.title}>
                                {currentTrack.name}
                            </h1>
                            <p className={styles.artist}>
                                {currentTrack.artists.join(', ')}
                            </p>
                        </div>

                        {/* 프로그레스 바 (인터랙티브) */}
                        <div className={styles.progressSection}>
                            <div
                                className={styles.progressBar}
                                onClick={handleSeek}
                            >
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progressPercent}%` }}
                                />
                                <div
                                    className={styles.progressHandle}
                                    style={{ left: `${progressPercent}%` }}
                                />
                            </div>
                            <div className={styles.timeRow}>
                                <span>{formatTime(position)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* 컨트롤러 (스토어 액션 연결) */}
                        <div className={styles.controls}>
                            <button
                                className={`${styles.subBtn} ${isShuffled ? styles.active : ''}`}
                                onClick={() => toggleShuffle(token)}
                            >
                                <FaRandom />
                            </button>

                            <button
                                className={styles.mainBtn}
                                onClick={prevTrack}
                            >
                                <FaStepBackward />
                            </button>

                            <button
                                className={styles.playToggle}
                                onClick={togglePlay}
                            >
                                {isPlaying ? (
                                    <FaPause />
                                ) : (
                                    <FaPlay style={{ marginLeft: '4px' }} />
                                )}
                            </button>

                            <button
                                className={styles.mainBtn}
                                onClick={nextTrack}
                            >
                                <FaStepForward />
                            </button>

                            <button
                                className={`${styles.subBtn} ${repeatMode !== 'off' ? styles.active : ''}`}
                                onClick={() => cycleRepeatMode(token)}
                            >
                                <FaRetweet />
                                {repeatMode === 'track' && (
                                    <span className={styles.repeatOne}>1</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
