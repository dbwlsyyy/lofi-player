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
import { formatTime } from '@/lib/formatTime';
import { useSession } from 'next-auth/react';

export default function SongDetailPage() {
    const { data: session } = useSession();
    const token = session?.accessToken;

    const router = useRouter();
    const [isClosing, setIsClosing] = useState(false);
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

    if (!currentTrack) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            router.back();
        }, 300);
    };

    const progressPercent = (position / duration) * 100 || 0;

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
                    <div className={styles.albumWrapper}>
                        <img
                            key={currentTrack.id}
                            src={currentTrack.image}
                            alt={currentTrack.name}
                            className={`${styles.albumArt} ${isPlaying ? styles.playing : ''}`}
                        />
                    </div>

                    <div className={styles.playerInfo}>
                        <div className={styles.songMeta}>
                            <h1 className={styles.title}>
                                {currentTrack.name}
                            </h1>
                            <p className={styles.artist}>
                                {currentTrack.artists.join(', ')}
                            </p>
                        </div>

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

                        <div className={styles.controls}>
                            <button
                                className={`${styles.subBtn} ${isShuffled ? styles.active : ''}`}
                                onClick={() => token && toggleShuffle(token)}
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
                                onClick={() => token && cycleRepeatMode(token)}
                            >
                                <FaRetweet size={25} />
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
