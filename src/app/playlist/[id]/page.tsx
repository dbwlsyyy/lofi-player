'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './PlaylistDetail.module.css';
import { Track } from '@/store/usePlayerStore';
import { fetchPlaylistTracks } from '@/apis/spotifyUserApi';
import { useSession } from 'next-auth/react';
import { usePlayControl } from '@/hooks/usePlayControl';
import { useUIStore } from '@/store/useUIStore';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import { FaPlay, FaChevronLeft, FaMusic } from 'react-icons/fa';
import LoadingDots from '@/components/LoadingDots/LoadingDots';
import { formatTime, formatTotalDuration } from '@/lib/formatTime';

export default function PlaylistDetailPage() {
    const { data: session } = useSession();
    const token = session?.accessToken;
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const playlistName = searchParams.get('name') || 'Your Selection';
    const playlistImg = searchParams.get('img');

    const { isRelaxMode } = useUIStore();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    const { playFromPlaylist } = usePlayControl();

    const totalMs = tracks.reduce(
        (acc, track) => acc + (track.durationMs || 0),
        0,
    );

    const displayTotalTime = formatTotalDuration(totalMs);

    useEffect(() => {
        if (!token || !id) return;
        const load = async () => {
            try {
                const list = await fetchPlaylistTracks(token, id as string);
                setTracks(list);
            } catch (err) {
                console.error('로드 실패:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, token]);

    return (
        <main className={styles.container}>
            <video
                className={`${styles.background} ${isRelaxMode ? styles.blurOff : styles.blurOn}`}
                src="/a.mp4"
                autoPlay
                loop
                muted
                playsInline
            />
            <div className={styles.overlay}></div>

            <div className={styles.content}>
                {!isRelaxMode && (
                    <div className={styles.wrapper}>
                        <nav className={styles.nav}>
                            <button
                                className={styles.backBtn}
                                onClick={() => router.back()}
                            >
                                <FaChevronLeft size={12} /> Back
                            </button>
                        </nav>

                        <header className={styles.hero}>
                            <div className={styles.heroArtWrapper}>
                                {playlistImg ? (
                                    <img
                                        src={playlistImg}
                                        alt="Cover"
                                        className={styles.heroArt}
                                    />
                                ) : (
                                    <div className={styles.emptyArt}>
                                        <FaMusic size={40} />
                                    </div>
                                )}
                            </div>
                            <div className={styles.heroText}>
                                <span className={styles.label}>PLAYLIST</span>
                                <h2 className={styles.title}>{playlistName}</h2>
                                <div className={styles.metaRow}>
                                    <span className={styles.dot}>•</span>
                                    <span>{tracks.length} tracks</span>
                                    <span className={styles.dot}>•</span>
                                    <span>
                                        {loading
                                            ? '0시간 00분'
                                            : displayTotalTime}
                                    </span>
                                </div>
                                <button
                                    className={styles.playBtn}
                                    onClick={() =>
                                        playFromPlaylist(tracks, 0, token!)
                                    }
                                >
                                    <FaPlay size={12} /> Play All
                                </button>
                            </div>
                        </header>

                        <section className={styles.listSection}>
                            <div className={styles.listHeader}>
                                <span className={styles.hNum}>#</span>
                                <span className={styles.hTitle}>TITLE</span>
                                <span className={styles.hArtist}>ARTIST</span>
                                <span className={styles.hTime}>TIME</span>
                            </div>
                            {loading ? (
                                <LoadingDots />
                            ) : (
                                <div className={styles.list}>
                                    {tracks.map((t, i) => (
                                        <div
                                            key={t.id}
                                            className={styles.row}
                                            onClick={() =>
                                                playFromPlaylist(
                                                    tracks,
                                                    i,
                                                    token!,
                                                )
                                            }
                                            style={{
                                                animationDelay: `${i * 0.05}s`,
                                            }}
                                        >
                                            <span className={styles.number}>
                                                {i + 1}
                                            </span>
                                            <div className={styles.trackMain}>
                                                <img
                                                    src={t.image}
                                                    alt={t.name}
                                                    className={styles.art}
                                                />
                                                <p className={styles.name}>
                                                    {t.name}
                                                </p>
                                            </div>
                                            <span className={styles.artist}>
                                                {t.artists.join(', ')}
                                            </span>
                                            <span className={styles.time}>
                                                {formatTime(t.durationMs)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </main>
    );
}
