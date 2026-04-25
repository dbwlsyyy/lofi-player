"use client";

import { useUiStore } from "@/store/useUiStore";
import styles from "./GlobalBackground.module.css";

export default function GlobalBackground() {
  const { isRelaxMode } = useUiStore();

  return (
    <>
      <video
        className={`${styles.background} ${isRelaxMode ? styles.blurOff : styles.blurOn}`}
        src="/a.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className={styles.overlay}></div>
    </>
  );
}
