'use client';
import { usePlayerStore } from '@/store/usePlayerStore';
import styles from './PlayerBar.module.css';
import Image from 'next/image';
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from 'react-icons/fa';

export default function PlayerBar() {
    const { currentTrack, isPlaying, pause, play, next, prev } =
        usePlayerStore();

    if (!currentTrack) return null; // 재생 중인 곡이 없으면 숨김

    return (
        <footer className={styles.playerBar}>
            {/* 왼쪽: 트랙 정보 */}
            <div className={styles.trackInfo}>
                <Image
                    src={currentTrack.image}
                    alt={currentTrack.name}
                    width={60}
                    height={60}
                    className={styles.albumArt}
                />
                <div className={styles.textInfo}>
                    <p className={styles.trackName}>{currentTrack.name}</p>
                    <p className={styles.trackArtist}>
                        {currentTrack.artists.join(', ')}
                    </p>
                </div>
            </div>

            {/* 중앙: 컨트롤 버튼 */}
            <div className={styles.controls}>
                <button onClick={prev} className={styles.controlBtn}>
                    <FaStepBackward />
                </button>
                <button
                    onClick={() =>
                        isPlaying ? pause() : currentTrack && play(currentTrack)
                    }
                    className={styles.controlBtn}
                >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button onClick={next} className={styles.controlBtn}>
                    <FaStepForward />
                </button>
            </div>

            {/* 오른쪽: 진행바 (임시값) */}
            <div className={styles.progress}>
                <div className={styles.progressFill}></div>
            </div>
        </footer>
    );
}
