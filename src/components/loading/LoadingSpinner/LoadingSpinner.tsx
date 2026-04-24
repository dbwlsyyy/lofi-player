'use client';

import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({
    message = 'Loading...',
}: {
    message?: string;
}) {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.message}>{message}</p>
        </div>
    );
}
