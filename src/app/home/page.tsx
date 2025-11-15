'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
    fetchMe,
    fetchPlaylists,
    type SpotifyPlaylistItem,
    type SpotifyUser,
} from '@/apis/spotifyUserApi';
import styles from './Home.module.css';
import ProfileHeader from './components/ProfileHeader';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;
    console.log('token', session?.accessToken);
    const router = useRouter();

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

                            <div className={styles.section}>
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
                                            onClick={() =>
                                                router.push(
                                                    `/playlist/${pl.id}`
                                                )
                                            }
                                        >
                                            <Image
                                                src={
                                                    pl.images?.[0]?.url ||
                                                    '/default_playlist.png'
                                                }
                                                alt={pl.name}
                                                width={200}
                                                height={200}
                                                className={styles.playlistImage}
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
                            </div>
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
