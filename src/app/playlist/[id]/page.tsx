'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './PlaylistDetail.module.css';
import { Track, usePlayerStore } from '@/store/usePlayerStore';
import { fetchPlaylistTracks } from '@/apis/spotifyUserApi';
import { useSession } from 'next-auth/react';
import { transferToDevice, playTrack } from '@/apis/spotifyPlayerApi';

export default function PlaylistDetailPage() {
    const { data: session } = useSession();
    const { id } = useParams();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    const { setQueue, playAtIndex, deviceId } = usePlayerStore();

    useEffect(() => {
        const token = session?.accessToken;
        if (!token || !id) return;

        const loadTracks = async () => {
            try {
                const list = await fetchPlaylistTracks(token, id as string);

                setTracks(list); //?
                setQueue(list);
            } catch (err) {
                console.error('플레이리스트 로드 실패:', err);
            } finally {
                setLoading(false);
            }
        };
        loadTracks();
    }, [id, session, setQueue]);

    async function handlePlayAll() {
        const token = session?.accessToken;
        if (!deviceId || !token) return;

        const uris = tracks.map((t) => `spotify:track:${t.id}`);

        // Spotify 내부 queue 설정
        await transferToDevice(deviceId, token);
        await playTrack(uris, deviceId, token);

        // UI queue는 이미 setQueue로 들어있으니 UI만 첫곡으로 이동
        playAtIndex(0);
    }

    if (loading) return <div className={styles.loading}>불러오는 중...</div>;

    return (
        <main className={styles.container}>
            <h2 className={styles.title}>플레이리스트 상세</h2>

            <button
                className={styles.playAllBtn}
                onClick={handlePlayAll}
                disabled={tracks.length === 0}
            >
                ▶ 전체 재생
            </button>

            <ul className={styles.trackList}>
                {tracks.map((t, i) => (
                    <li
                        key={t.id}
                        className={styles.trackItem}
                        onClick={() => playAtIndex(i)}
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
