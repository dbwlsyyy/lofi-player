'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
    fetchMe,
    fetchPlaylists,
    type SpotifyPlaylistItem,
    type SpotifyUser,
} from '@/lib/spotify';
import styles from './Home.module.css';
import ProfileHeader from './components/ProfileHeader';

export default function HomePage() {
    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;

    const [me, setMe] = useState<SpotifyUser | null>(null);
    const [playlists, setPlaylists] = useState<SpotifyPlaylistItem[]>([]);
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
            } catch (e: any) {
                if (e.response?.status === 401)
                    signIn('spotify'); // 만료 시 자동 로그인
                else setError('Spotify API 호출 실패');
            }
        })();
    }, [accessToken]);

    if (status === 'loading') {
        return <main className={styles.loading}>로딩 중...</main>;
    }

    return (
        <main className={styles.container}>
            <video
                className={`${styles.background} ${
                    isRelaxMode ? styles.blurOff : styles.blurOn
                }`}
                src="/a.mp4"
                autoPlay
                loop
                muted
                playsInline
            ></video>

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
                                    {playlists.map(
                                        (
                                            pl // 근데 타입 맞춰주니까 여기서 오류 하나도 안 나네?
                                        ) => (
                                            <div
                                                key={pl.id}
                                                className={styles.playlistCard}
                                                onClick={() =>
                                                    console.log(pl.name)
                                                }
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
                                        )
                                    )}
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

                    <footer>
                        {isRelaxMode && (
                            <button
                                className={styles.exitRelaxBtn}
                                onClick={() => setIsRelaxMode(false)}
                            >
                                플레이리스트 열기
                            </button>
                        )}
                    </footer>
                </>
            )}
        </main>
    );
}
