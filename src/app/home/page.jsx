'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { fetchMe } from '@/lib/spotify';
import styles from './Home.module.css';
import ProfileHeader from './components/ProfileHeader';

export default function HomePage() {
    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;
    const [me, setMe] = useState(null);
    const [error, setError] = useState('');
    const [isRelaxMode, setIsRelaxMode] = useState(false);

    useEffect(() => {
        if (!accessToken) return;
        (async () => {
            try {
                const profile = await fetchMe(accessToken);
                setMe(profile);
            } catch (e) {
                setError('프로필 정보를 가져오지 못했습니다.');
                console.error(e);
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
            />

            {/* 로그인 안 한 상태 */}
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

            {/* 로그인한 상태 */}
            {me && (
                <>
                    {/* 일반 모드일 때만 보이게 */}
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
                                <p className={styles.sectionDesc}>
                                    로그인된 Spotify 계정의 플레이리스트를
                                    불러옵니다.
                                </p>
                                <button
                                    className={styles.toggleBtn}
                                    onClick={() => setIsRelaxMode(true)}
                                >
                                    🌙 휴식모드로 전환
                                </button>
                            </section>
                        </>
                    )}

                    {/* 하단 재생바는 항상 표시 */}
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
