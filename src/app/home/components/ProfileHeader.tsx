'use client';
import styles from './ProfileHeader.module.css';

export default function ProfileHeader({ profile, onLogout }) {
    if (!profile) return null;

    return (
        <div className={styles.header}>
            <div className={styles.left}>
                <img
                    src={profile.images?.[0]?.url || '/default_profile.png'}
                    alt="프로필 사진"
                    className={styles.avatar}
                />
                <div>
                    <h2 className={styles.name}>{profile.display_name}</h2>
                    <p className={styles.followers}>
                        팔로워 {profile.followers?.total ?? 0}명
                    </p>
                </div>
            </div>

            <button className={styles.logoutBtn} onClick={onLogout}>
                로그아웃
            </button>
        </div>
    );
}
