'use client';

import styles from './PlayerBar.module.css';
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from 'react-icons/fa';
import Image from 'next/image';

export default function PlayerBar() {
    return (
        <div className={styles.playerBar}>
            <Image
                src="/default_album.png"
                alt="album"
                className={styles.albumArt}
                width={48}
                height={48}
                priority
            />
            <div>
                <h4 className={styles.trackTitle}>재생 중인 곡 없음</h4>
                <p className={styles.trackArtist}>곡을 선택해주세요</p>
            </div>

            <div className={styles.controls}>
                <FaStepBackward />
                <FaPlay />
                <FaStepForward />
            </div>
        </div>
    );
}
