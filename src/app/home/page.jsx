'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { fetchMe } from '@/lib/spotify';
import styles from './Home.module.css';

export default function HomePage() {
    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;
    const [me, setMe] = useState(null);

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

    // 로그인 중/확인 중일 때 로딩 처리
    if (status === 'loading') {
        return <main className={styles.loading}>로딩 중...</main>;
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.greeting}>
                    {me?.display_name
                        ? `안녕하세요, ${me.display_name}님`
                        : '로그인이 필요합니다 🎧'}
                </h2>

                {accessToken ? (
                    <button
                        className={styles.logoutBtn}
                        onClick={() => signOut()}
                    >
                        로그아웃
                    </button>
                ) : (
                    <button
                        className={styles.loginBtn}
                        onClick={() =>
                            signIn('spotify', { callbackUrl: '/home' })
                        }
                    >
                        로그인
                    </button>
                )}
            </header>
        </main>
    );
}
