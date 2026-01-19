'use client';

import { useUIStore } from '@/store/useUIStore';
import styles from './ToggleBtn.module.css';

export default function ToggleBtn() {
    const { isRelaxMode, toggleRelaxMode } = useUIStore();
    return (
        <div className={styles.glassToggle} onClick={toggleRelaxMode}>
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
    );
}
