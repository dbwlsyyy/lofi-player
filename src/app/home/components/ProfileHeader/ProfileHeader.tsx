"use client";

import Image from "next/image";
import styles from "./ProfileHeader.module.css";
import { FaSpotify } from "react-icons/fa";
import { SpotifyUser } from "@/apis/spotifyUserApi";
import { FiSettings, FiLogOut } from "react-icons/fi";

interface ProfileHeaderProps {
  profile: SpotifyUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

export default function ProfileHeader({ profile, onLogin, onLogout }: ProfileHeaderProps) {
  return (
    <div className={styles.headerContainer}>
      {!profile ? (
        <button
          className={styles.iconCircle}
          onClick={onLogin}
          title="Spotify Login"
        >
          <FaSpotify
            size="1.8rem"
            color="#1DB954"
          />
        </button>
      ) : (
        <div className={styles.profileWrapper}>
          {/* 설정 아이콘처럼 보이는 프로필 버튼 */}
          <button
            className={styles.iconCircle}
            onClick={onLogout}
            title="Logout"
          >
            <Image
              src={profile.images?.[0]?.url || "/default_profile.png"}
              alt="Profile"
              width={36}
              height={36}
              className={styles.avatar}
            />
            {/* 호버 시 나타날 로그아웃 아이콘 */}
            <div className={styles.logoutOverlay}>
              <FiLogOut size="1.4rem" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
