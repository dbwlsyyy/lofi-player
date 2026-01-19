'use client';

import Image from 'next/image';
import styles from './ProfileHeader.module.css';
import { FaSpotify } from 'react-icons/fa';
import { SpotifyUser } from '@/apis/spotifyUserApi';
import { FiLogOut } from 'react-icons/fi';

interface ProfileHeaderProps {
    profile: SpotifyUser | null;
    onLogin: () => void;
    onLogout: () => void;
}

export default function ProfileHeader({
    profile,
    onLogin,
    onLogout,
}: ProfileHeaderProps) {
    return (
        <header className={styles.headerContainer}>
            {!profile && (
                <button className={styles.loginBtn} onClick={onLogin}>
                    <FaSpotify className={styles.spotifyIcon} />
                    <span>Spotify로 시작하기</span>
                </button>
            )}

            {profile && (
                <>
                    <div className={styles.profileBox}>
                        <div className={styles.avatarWrapper}>
                            <Image
                                src={
                                    profile.images?.[0]?.url ||
                                    '/default_profile.png'
                                }
                                alt="Profile"
                                width={48}
                                height={48}
                                className={styles.avatar}
                            />
                            <div className={styles.onlineBadge}></div>
                        </div>

                        <div className={styles.userInfo}>
                            <h2 className={styles.userName}>
                                {profile.display_name}
                            </h2>
                            <p className={styles.userStatus}>
                                <span className={styles.blueText}>Spotify</span>{' '}
                                {profile.product}
                            </p>
                        </div>
                        <button className={styles.logoutBtn} onClick={onLogout}>
                            <FiLogOut />
                        </button>
                    </div>
                </>
            )}
        </header>
    );
}
