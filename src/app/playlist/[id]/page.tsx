'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './PlaylistDetail.module.css';
import { Track, usePlayerStore } from '@/store/usePlayerStore';
import { fetchPlaylistTracks } from '@/lib/spotify';
import { useSession } from 'next-auth/react';

export default function PlaylistDetailPage() {
    const { data: session } = useSession();

    const { id } = useParams(); // URL에서 [id] 부분 가져옴
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    const { enqueue, play } = usePlayerStore();

    useEffect(() => {
        if (!session?.accessToken || !id) return;

        const loadTracks = async () => {
            try {
                const list = await fetchPlaylistTracks(
                    session.accessToken,
                    id as string
                );
                setTracks(list);
            } catch (err) {
                console.error('플레이리스트 로드 실패:', err);
            } finally {
                setLoading(false);
            }
        };
        loadTracks();
    }, [id]);

    if (loading) return <div className={styles.loading}>불러오는 중...</div>;

    return (
        <main className={styles.container}>
            <h2 className={styles.title}>플레이리스트 상세</h2>

            <button
                className={styles.playAllBtn}
                onClick={() => enqueue(tracks)}
                disabled={tracks.length === 0}
            >
                ▶ 전체 재생
            </button>

            <ul className={styles.trackList}>
                {tracks.map((t) => (
                    <li
                        key={t.id}
                        className={styles.trackItem}
                        onClick={() => play(t)}
                    >
                        <img
                            src={t.image}
                            alt={t.name}
                            className={styles.albumArt}
                        />
                        <div>
                            <p className={styles.trackName}>{t.name}</p>
                            <span className={styles.trackArtist}>
                                {t.artists.join(', ')}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </main>
    );
}
