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
import { FaSpotify } from 'react-icons/fa';

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
                const profile = await fetchMe(accessToken);
                setMe(profile);

                const list = await fetchPlaylists(accessToken);
                setPlaylists(list);
            } catch (e: any) {
                if (e.response?.status === 401) {
                    signIn('spotify'); // 토큰 만료 시 재로그인 유도
                } else {
                    setError(
                        'Spotify 데이터를 불러오는 중 오류가 발생했습니다.'
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
            {/* 배경 비디오 섹션 */}
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

            {/* 비디오 위 시각적 깊이감을 주는 오버레이 */}
            <div className={styles.overlay}></div>

            {/* 1. 비로그인 상태: 세련된 Hero 로그인 섹션 */}
            {!me && (
                <section className={styles.heroSection}>
                    <div className={styles.loginCard}>
                        <div className={styles.brand}>
                            <h1 className={styles.mainTitle}>
                                VIBE
                                <span className={styles.bluePoint}>.</span>
                            </h1>
                            <p className={styles.subTitle}>
                                공간을 채우는 가장 완벽한 선율
                            </p>
                        </div>

                        <button
                            className={styles.loginBtn}
                            onClick={() =>
                                signIn('spotify', { callbackUrl: '/home' })
                            }
                        >
                            <FaSpotify className={styles.spotifyIcon} />
                            <span>Spotify로 시작하기</span>
                        </button>

                        <p className={styles.footerText}>
                            플레이리스트를 연동하여 나만의 몰입 시간을
                            가져보세요.
                        </p>
                    </div>
                </section>
            )}

            {/* 2. 로그인 상태: 메인 콘텐츠 섹션 */}
            {me && (
                <div className={styles.contentWrapper}>
                    {!isRelaxMode && (
                        <>
                            <ProfileHeader
                                profile={me}
                                onLogout={() => signOut()}
                            />

                            <div className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>
                                        Your Library
                                    </h3>
                                    <p className={styles.sectionDesc}>
                                        최근 저장된 플레이리스트
                                    </p>
                                </div>

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

                                <button
                                    className={styles.toggleBtn}
                                    onClick={() => setIsRelaxMode(true)}
                                >
                                    휴식 모드 진입
                                </button>
                            </div>
                        </>
                    )}

                    {/* 휴식 모드에서만 보이는 하단 바 */}
                    {isRelaxMode && (
                        <footer className={styles.relaxFooter}>
                            <button
                                className={styles.exitRelaxBtn}
                                onClick={() => setIsRelaxMode(false)}
                            >
                                <span className={styles.exitIcon}>↑</span>
                                플레이리스트 열기
                            </button>
                        </footer>
                    )}
                </div>
            )}
        </main>
    );
}
