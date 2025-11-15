'use client';

import { usePlayerStore } from '@/store/usePlayerStore';
import styles from './PlayerBar.module.css';
import Image from 'next/image';
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
    transferToDevice,
    playTrack,
    pauseTrack,
    nextTrack,
} from '@/apis/spotifyPlayerApi';

export default function PlayerBar() {
    const { deviceId, currentTrack, isPlaying, pause, play, next, prev } =
        usePlayerStore();
    const { data: session } = useSession();
    const accessToken = (session as any)?.accessToken;

    async function handlePlayClick() {
        if (!currentTrack || !deviceId || !accessToken) return;

        const uri = `spotify:track:${currentTrack.id}`;

        try {
            await transferToDevice(deviceId, accessToken);

            await playTrack([uri], deviceId, accessToken);

            play(currentTrack);
        } catch (err) {
            console.error('재생 오류:', err);
        }
    }

    async function handlePauseClick() {
        if (!deviceId || !accessToken) return;

        try {
            await pauseTrack(deviceId, accessToken);
            pause();
        } catch (err) {
            console.error('일시정지 오류:', err);
        }
    }

    async function handleNextClick() {
        if (!deviceId || !accessToken) return;

        try {
            await nextTrack(deviceId, accessToken);
            next();
        } catch (err) {
            console.error('다음 곡 오류:', err);
        }
    }

    async function handlePrevClick() {
        prev();
    }

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
                                    onClick={handlePrevClick}
                                    className={styles.controlBtn}
                                >
                                    <FaStepBackward />
                                </button>
                                <button
                                    onClick={
                                        isPlaying
                                            ? handlePauseClick
                                            : handlePlayClick
                                    }
                                    className={styles.controlBtn}
                                >
                                    {isPlaying ? <FaPause /> : <FaPlay />}
                                </button>
                                <button
                                    onClick={handleNextClick}
                                    className={styles.controlBtn}
                                >
                                    <FaStepForward />
                                </button>
                            </div>

                            <div className={styles.progress}>
                                <div className={styles.progressFill}></div>
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
