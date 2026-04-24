'use client';

import styles from './LoadingDots.module.css';

export default function LoadingDots() {
    return (
        <div className={styles.container}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
        </div>
    );
}
