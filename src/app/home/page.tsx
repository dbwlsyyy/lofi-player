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
    const router = useRouter();

    const [me, setMe] = useState<SpotifyUser | null>(null);
    const [playlists, setPlaylists] = useState<SpotifyPlaylistItem[]>([]);
    const [error, setError] = useState('');
    const [isRelaxMode, setIsRelaxMode] = useState(false);

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
                    signIn('spotify');
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
                            onLogin={() => signIn('spotify')} // 질문! 여기서 'spotify'가 있으면 바로 로그인돼서 홈 화면 진입하는데 왜 이걸 빼면 http://127.0.0.1:3000/api/auth/signin?callbackUrl=http%3A%2F%2F127.0.0.1%3A3000%2Fhome로 이동하면서 sign in spotify 화면이 뜨고 그걸 클릭해야 로그인돼서 홈화면 진입되는거임?
                            onLogout={() => signOut()}
                        />

                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h3 className={styles.sectionTitle}>
                                    My Library
                                </h3>
                                <p className={styles.sectionDesc}>
                                    스포티파이에 저장된 플레이리스트
                                </p>
                            </div>

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
                                                className={styles.imageWrapper}
                                            >
                                                <Image
                                                    src={
                                                        pl.images?.[0]?.url ||
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
                                                className={styles.playlistInfo}
                                            >
                                                <h4>{pl.name}</h4>
                                                <p>{pl.tracks.total} Tracks</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div
                    className={styles.glassToggle}
                    onClick={() => setIsRelaxMode(!isRelaxMode)}
                >
                    <div
                        className={`${styles.glassThumb} ${isRelaxMode ? styles.on : ''}`}
                    >
                        <div className={styles.energyGlow}></div>
                    </div>
                    <div className={styles.toggleLabels}>
                        <span>OFF</span>
                        <span>RELAX</span>
                    </div>
                </div>
            </div>
        </main>
    );
}
