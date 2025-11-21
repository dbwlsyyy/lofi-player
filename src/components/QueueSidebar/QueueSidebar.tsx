'use client';
import { usePlayerStore } from '@/store/usePlayerStore';
import styles from './QueueSidebar.module.css';

export default function QueueSidebar() {
    const { queue, currentIndex, currentTrack, isQueueOpen } = usePlayerStore();

    return (
        <aside
            className={`${styles.sidebar} ${isQueueOpen ? styles.open : ''}`}
        >
            <h2 className={styles.title}>Playlist</h2>
            {currentTrack && (
                <>
                    <div className={styles.sectionTitle}>지금 재생 중</div>

                    <div className={`${styles.item} ${styles.active}`}>
                        <img
                            src={currentTrack.image}
                            className={styles.thumb}
                        />

                        <div className={styles.textGroup}>
                            <div className={styles.titleText}>
                                {currentTrack.name}
                            </div>
                            <div className={styles.artistText}>
                                {currentTrack.artists.join(', ')}
                            </div>
                        </div>

                        <div className={styles.eqWrapper}>
                            <div className={styles.eqBar}></div>
                            <div className={styles.eqBar}></div>
                            <div className={styles.eqBar}></div>
                        </div>
                    </div>
                </>
            )}
            <div className={styles.sectionTitle}>현재 재생목록</div>

            <div className={styles.list}>
                {queue.map((track, index) => {
                    const isActive = index === currentIndex;

                    return (
                        <div
                            key={track.id}
                            className={`${styles.item} ${isActive ? styles.activeBlack : ''}`}
                        >
                            <img src={track.image} className={styles.thumb} />

                            <div className={styles.textGroup}>
                                <div className={styles.titleText}>
                                    {track.name}
                                </div>
                                <div className={styles.artistText}>
                                    {track.artists.join(', ')}
                                </div>
                            </div>
                            {isActive && (
                                <div className={styles.eqWrapper}>
                                    <div className={styles.eqBarBlack}></div>
                                    <div className={styles.eqBarBlack}></div>
                                    <div className={styles.eqBarBlack}></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
