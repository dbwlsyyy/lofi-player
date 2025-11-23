'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './PlaylistDetail.module.css';
import { Track } from '@/store/usePlayerStore';
import { fetchPlaylistTracks } from '@/apis/spotifyUserApi';
import { useSession } from 'next-auth/react';
import { usePlayControl } from '@/hooks/usePlayControl';

export default function PlaylistDetailPage() {
    const { data: session } = useSession();
    const token = session?.accessToken;
    const { id } = useParams();

    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    const { playFromPlaylist } = usePlayControl();

    useEffect(() => {
        if (!token || !id) return;

        const load = async () => {
            try {
                const list = await fetchPlaylistTracks(token, id as string);
                setTracks(list);
            } catch (err) {
                console.error('플레이리스트 로드 실패:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, token]);

    if (loading) return <div className={styles.loading}>불러오는 중...</div>;

    return (
        <main className={styles.container}>
            <h2 className={styles.title}>플레이리스트 상세</h2>

            <button
                className={styles.playAllBtn}
                onClick={() => playFromPlaylist(tracks, 0, token!)}
                disabled={tracks.length === 0}
            >
                ▶ 전체 재생
            </button>

            <ul className={styles.trackList}>
                {tracks.map((t, i) => (
                    <li
                        key={t.id}
                        className={styles.trackItem}
                        onClick={() => playFromPlaylist(tracks, i, token!)}
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
