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
import { useUIStore } from '@/store/useUIStore';

export default function HomePage() {
    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;
    const router = useRouter();

    const { isRelaxMode } = useUIStore();

    const [me, setMe] = useState<SpotifyUser | null>(null);
    const [playlists, setPlaylists] = useState<SpotifyPlaylistItem[]>([]);
    const [error, setError] = useState('');

    const handleLogin = () => {
        signIn('spotify', { callbackUrl: '/home' });
    };

    const handleLogout = () => {
        signOut();
        setMe(null);
        setPlaylists([]);
    };

    useEffect(() => {
        if (!accessToken) return;

        (async () => {
            try {
                const [profile, list] = await Promise.all([
                    fetchMe(accessToken),
                    fetchPlaylists(accessToken),
                ]);
                setMe(profile);
                setPlaylists(list);
            } catch (e: any) {
                if (e.response?.status === 401) {
                    handleLogin();
                } else {
                    setError(
                        'Spotify 데이터를 불러오는 중 오류가 발생했습니다.',
                    );
                }
            }
        })();
    }, [accessToken]);

    // 로딩 상태 화면
    if (status === 'loading') {
        return (
            <main className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>당신의 리듬을 찾는 중...</p>
            </main>
        );
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
            <div className={styles.overlay}></div>

            <div className={styles.contentWrapper}>
                {!isRelaxMode && (
                    <>
                        <ProfileHeader
                            profile={me}
                            onLogin={handleLogin}
                            onLogout={handleLogout}
                        />

                        <div className={styles.section}>
                            {error && <p className={styles.error}>{error}</p>}
                            {!me && (
                                <section className={styles.heroSection}>
                                    <div className={styles.loginCard}>
                                        <div className={styles.brand}>
                                            {/* <h1 className={styles.mainTitle}>
                                                VIBE
                                                <span
                                                    className={styles.bluePoint}
                                                >
                                                    .
                                                </span>
                                            </h1> */}
                                            <p className={styles.subTitle}>
                                                로그인이 필요합니다.
                                            </p>
                                        </div>

                                        <p className={styles.footerText}>
                                            플레이리스트를 연동하여
                                            불러와보세요!
                                        </p>
                                    </div>
                                </section>
                            )}

                            {me && (
                                <>
                                    <div className={styles.sectionHeader}>
                                        <h3 className={styles.sectionTitle}>
                                            My Library
                                        </h3>
                                        <p className={styles.sectionDesc}>
                                            스포티파이에 저장된 플레이리스트
                                        </p>
                                    </div>
                                    <div className={styles.playlistGrid}>
                                        {playlists.map((pl) => (
                                            <div
                                                key={pl.id}
                                                className={styles.playlistCard}
                                                onClick={() =>
                                                    router.push(
                                                        `/playlist/${pl.id}`,
                                                    )
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.imageWrapper
                                                    }
                                                >
                                                    <Image
                                                        src={
                                                            pl.images?.[0]
                                                                ?.url ||
                                                            '/default_playlist.png'
                                                        }
                                                        alt={pl.name}
                                                        fill
                                                        className={
                                                            styles.playlistImage
                                                        }
                                                    />
                                                </div>
                                                <div
                                                    className={
                                                        styles.playlistInfo
                                                    }
                                                >
                                                    <h4>{pl.name}</h4>
                                                    <p>
                                                        {pl.tracks.total} Tracks
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
