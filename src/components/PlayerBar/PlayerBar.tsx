'use client';

import { usePlayerStore } from '@/store/usePlayerStore';
import styles from './PlayerBar.module.css';
import Image from 'next/image';
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerBar() {
    const {
        currentTrack,
        isPlaying,
        position,
        duration,
        sdkTogglePlay,
        sdkNextTrack,
        prev,
        sdkSeek,
    } = usePlayerStore();

    const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!duration || duration === 0) return;

        const progressBar = e.currentTarget;
        const clickX = e.nativeEvent.offsetX;
        const width = progressBar.clientWidth;

        const seekPercent = clickX / width;
        const seekMs = Math.floor(seekPercent * duration);

        sdkSeek(seekMs);
    };

    return (
        <footer className={styles.playerBar}>
            <AnimatePresence mode="wait">
                {currentTrack ? (
                    <>
                        <div className={styles.leftArea}>
                            <motion.div
                                key={currentTrack.id}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{
                                    duration: 0.4,
                                    ease: [0.5, 0.5, 0.5, 1],
                                }}
                                className={styles.trackInfo}
                            >
                                <Image
                                    src={currentTrack.image}
                                    alt={currentTrack.name}
                                    width={60}
                                    height={60}
                                    className={styles.albumArt}
                                />
                                <div className={styles.textInfo}>
                                    <p className={styles.trackName}>
                                        {currentTrack.name}
                                    </p>
                                    <p className={styles.trackArtist}>
                                        {currentTrack.artists.join(', ')}
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        <div className={styles.centerArea}>
                            <div className={styles.controls}>
                                <button
                                    onClick={prev}
                                    className={styles.controlBtn}
                                >
                                    <FaStepBackward />
                                </button>
                                <button
                                    onClick={() => {
                                        if (currentTrack) sdkTogglePlay();
                                    }}
                                    className={styles.controlBtn}
                                >
                                    {isPlaying ? <FaPause /> : <FaPlay />}
                                </button>
                                <button
                                    onClick={sdkNextTrack}
                                    className={styles.controlBtn}
                                >
                                    <FaStepForward />
                                </button>
                            </div>

                            <div
                                className={styles.progress}
                                onClick={handleSeek}
                            >
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className={styles.rightArea}></div>
                    </>
                ) : (
                    <motion.div
                        key="player-empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={styles.emptyState}
                    >
                        <p>🎧 현재 재생 중인 곡이 없습니다.</p>
                        <p className={styles.hint}>
                            플레이리스트에서 곡을 선택하세요.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </footer>
    );
}
