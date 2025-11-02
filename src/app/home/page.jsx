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
                console.log('profile', profile);
            } catch (e) {
                setError('프로필 정보를 가져오지 못했습니다.');
                console.error(e);
            }
        })();
    }, [accessToken]);

    // 로그인 중/확인 중일 때 로딩 처리
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

            {me ? (
                <ProfileHeader profile={me} onLogout={() => signOut()} />
            ) : (
                <button
                    className={styles.loginBtn}
                    onClick={() => signIn('spotify', { callbackUrl: '/home' })}
                >
                    로그인
                </button>
            )}

            {/* 👇 여기에 앞으로 플레이리스트/추천영역 붙일 예정 */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>내 플레이리스트</h3>
                <p className={styles.sectionDesc}>
                    로그인된 Spotify 계정의 플레이리스트를 불러옵니다.
                </p>
            </section>
        </main>
    );
}
