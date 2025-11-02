'use client';

import { signIn } from 'next-auth/react';
import styles from './Login.module.css';

export default function LoginPage() {
    const handleLogin = () => {
        signIn('spotify', { callbackUrl: '/home' });
    };

    return (
        <main className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Lofi Player 🎧</h1>
                <button className={styles.spotifyBtn} onClick={handleLogin}>
                    Spotify로 로그인
                </button>
            </div>
        </main>
    );
}
