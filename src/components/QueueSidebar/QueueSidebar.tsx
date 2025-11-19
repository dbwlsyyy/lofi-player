'use client';

import { usePlayerStore } from '@/store/usePlayerStore';
import styles from './QueueSidebar.module.css';

export default function QueueSidebar() {
    const { queue, currentTrack, isQueueOpen } = usePlayerStore();

    return (
        <aside
            className={`${styles.sidebar} ${isQueueOpen ? styles.open : ''}`}
        >
            <h2 className={styles.title}>재생목록</h2>

            <div className={styles.list}>
                {queue.map((track) => (
                    <div
                        key={track.id}
                        className={`${styles.item} ${
                            track.id === currentTrack?.id ? styles.active : ''
                        }`}
                    >
                        {track.name}
                    </div>
                ))}
            </div>
        </aside>
    );
}
