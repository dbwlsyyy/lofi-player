'use client';

import { usePlayerStore } from '@/store/usePlayerStore';
import styles from './PlayerBar.module.css';
import Image from 'next/image';
import {
    FaPlay,
    FaPause,
    FaStepForward,
    FaStepBackward,
    FaRandom,
    FaRedo,
    FaVolumeMute,
    FaVolumeUp,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { formatTime } from '@/lib/formatTime';
import { useRef } from 'react';

export default function PlayerBar() {
    const { data: session } = useSession();
    const accessToken = session?.accessToken;
    const {
        currentTrack,
        isPlaying,
        position,
        duration,
        isShuffled,
        repeatMode,
        volume,
        cycleRepeatMode,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        toggleQueue,
        setVolume,
        toggleShuffle,
    } = usePlayerStore();

    const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!duration) return;

        const progressBar = e.currentTarget;
        const clickX = e.nativeEvent.offsetX;
        const width = progressBar.clientWidth;

        const seekPercent = clickX / width;
        const seekMs = Math.floor(seekPercent * duration);

        seekTo(seekMs);
    };

    const lastVolumeRef = useRef(volume || 0.5);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number(e.target.value) / 100;
        setVolume(newVolume);

        if (newVolume > 0) {
            lastVolumeRef.current = newVolume;
        }
    };

    const toggleMute = () => {
        if (volume > 0) {
            lastVolumeRef.current = volume;
            setVolume(0);
        } else {
            setVolume(lastVolumeRef.current);
        }
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
                                    className={`${styles.albumArt} ${isPlaying ? styles.playingArt : ''}`}
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
                                    onClick={() =>
                                        accessToken &&
                                        toggleShuffle(accessToken)
                                    }
                                    className={`${styles.controlBtn}  ${isShuffled ? styles.activeBtn : ''}`}
                                    title="셔플 켜기/끄기"
                                >
                                    <FaRandom size={17} />
                                </button>
                                <button
                                    onClick={prevTrack}
                                    className={styles.controlBtn}
                                >
                                    <FaStepBackward
                                        style={{ marginLeft: '2rem' }}
                                    />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className={`${styles.controlBtn} ${styles.playBtn}`}
                                >
                                    {isPlaying ? <FaPause /> : <FaPlay />}
                                </button>
                                <button
                                    onClick={nextTrack}
                                    className={styles.controlBtn}
                                >
                                    <FaStepForward
                                        style={{ marginRight: '2rem' }}
                                    />
                                </button>
                                <button
                                    onClick={() =>
                                        accessToken &&
                                        cycleRepeatMode(accessToken)
                                    }
                                    className={`${styles.controlBtn} ${repeatMode !== 'off' ? styles.activeBtn : ''}`}
                                    title={`반복 모드: ${repeatMode}`}
                                >
                                    <FaRedo size={17} />
                                    {repeatMode === 'track' && (
                                        <span className={styles.repeatSpan}>
                                            1
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className={styles.progressContainer}>
                                <span className={styles.timeText}>
                                    {formatTime(position)}
                                </span>
                                <div
                                    className={styles.progressBar}
                                    onClick={handleSeek}
                                >
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <span className={styles.timeText}>
                                    {formatTime(duration)}
                                </span>
                            </div>
                        </div>

                        <div className={styles.rightArea}>
                            <div className={styles.volumeWrapper}>
                                {volume === 0 ? (
                                    <FaVolumeMute
                                        className={styles.volumeIcon}
                                        onClick={toggleMute}
                                    />
                                ) : (
                                    <FaVolumeUp
                                        className={styles.volumeIcon}
                                        onClick={toggleMute}
                                    />
                                )}
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volume * 100}
                                    onChange={handleVolumeChange}
                                    className={styles.volumeSlider}
                                    style={{
                                        background: `linear-gradient(to right, #fff ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`,
                                    }}
                                />
                            </div>
                            <button
                                className={styles.hamburger}
                                onClick={toggleQueue}
                            >
                                <FiMenu size={22} />
                            </button>
                        </div>
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
