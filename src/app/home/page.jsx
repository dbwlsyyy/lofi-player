'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { fetchMe, fetchPlaylists } from '@/lib/spotify';
import styles from './Home.module.css';
import ProfileHeader from './components/ProfileHeader';

export default function HomePage() {
    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;
    const [me, setMe] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [error, setError] = useState('');
    const [isRelaxMode, setIsRelaxMode] = useState(false);

    useEffect(() => {
        if (!accessToken) return;

        (async () => {
            try {
                const profile = await fetchMe(accessToken);
                setMe(profile);

                const list = await fetchPlaylists(accessToken);
                setPlaylists(list);
            } catch (e) {
                console.error(e);
                setError('Spotify API 호출 실패');
            }
        })();
    }, [accessToken]);

    if (status === 'loading') {
        return <main className={styles.loading}>로딩 중...</main>;
    }

    return (
        <main className={styles.container}>
            <div
                className={`${styles.background} ${
                    isRelaxMode ? styles.blurOff : styles.blurOn
                }`}
            ></div>

            {!me && (
                <div className={styles.centerContent}>
                    <button
                        className={styles.loginBtn}
                        onClick={() =>
                            signIn('spotify', { callbackUrl: '/home' })
                        }
                    >
                        Spotify 로그인
                    </button>
                </div>
            )}

            {me && (
                <>
                    {!isRelaxMode && (
                        <>
                            <ProfileHeader
                                profile={me}
                                onLogout={() => signOut()}
                            />

                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>
                                    내 플레이리스트
                                </h3>

                                {error && (
                                    <p className={styles.error}>{error}</p>
                                )}

                                <div className={styles.playlistGrid}>
                                    {playlists.map((pl) => (
                                        <div
                                            key={pl.id}
                                            className={styles.playlistCard}
                                            onClick={() => console.log(pl.name)}
                                        >
                                            <img
                                                src={
                                                    pl.images?.[0]?.url ||
                                                    '/default_playlist.png'
                                                }
                                                alt={pl.name}
                                            />
                                            <h4>{pl.name}</h4>
                                            <p>{pl.tracks.total}곡</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className={styles.toggleBtn}
                                    onClick={() => setIsRelaxMode(true)}
                                >
                                    휴식모드로 전환
                                </button>
                            </section>
                        </>
                    )}

                    <footer className={styles.playerBar}>
                        🎧 Now Playing: Chill Vibes
                        {isRelaxMode && (
                            <button
                                className={styles.exitRelaxBtn}
                                onClick={() => setIsRelaxMode(false)}
                            >
                                ⏫ 일반모드 복귀
                            </button>
                        )}
                    </footer>
                </>
            )}
        </main>
    );
}
