"use client";

import { FaSpotify } from "react-icons/fa";
import styles from "./LoginHero.module.css";

interface LoginHeroProps {
  onLogin: () => void;
}

export default function LoginHero({ onLogin }: LoginHeroProps) {
  return (
    <section className={styles.container}>
      <FaSpotify className={styles.icon} />
      <h2 className={styles.title}>Spotify 연결이 필요해요</h2>
      <p className={styles.description}>
        내 플레이리스트를 불러오려면 로그인을 해주세요.
      </p>

      <button
        className={styles.loginBtn}
        onClick={onLogin}
      >
        Spotify로 계속하기
      </button>
    </section>
  );
}
