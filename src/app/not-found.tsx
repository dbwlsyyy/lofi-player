'use client';

import Link from 'next/link';
import styles from './not-found.module.css';
import { FaMusic, FaHome } from 'react-icons/fa';

export default function NotFound() {
    return (
        <main className={styles.container}>
            <div className={styles.glassCard}>
                <div className={styles.iconWrapper}>
                    <FaMusic className={styles.floatingIcon} />
                </div>

                <h1 className={styles.title}>404 ERROR</h1>
                <p className={styles.message}>
                    요청하신 페이지를 찾을 수 없습니다.
                </p>

                <Link
                    href="/home"
                    className={styles.homeBtn}
                >
                    <FaHome size={16} />
                    <span>홈으로 돌아가기</span>
                </Link>
            </div>
        </main>
    );
}
