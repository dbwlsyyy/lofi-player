'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, KeyboardEvent } from 'react';
import styles from './PlaylistDetail.module.css';
import { Track } from '@/store/usePlayerStore';
import { fetchPlaylistTracks, updatePlaylistName } from '@/apis/spotifyUserApi';
import { useSession } from 'next-auth/react';
import { usePlayControl } from '@/hooks/usePlayControl';
import { useUIStore } from '@/store/useUIStore';
import {
    FaPlay,
    FaChevronLeft,
    FaMusic,
    FaRegEdit,
    FaCheck,
    FaTimes,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import LoadingDots from '@/components/LoadingDots/LoadingDots';
import { formatTime } from '@/lib/formatTime';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function PlaylistDetailPage() {
    const { data: session } = useSession();
    const token = session?.accessToken;
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { isRelaxMode } = useUIStore();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    const initialName = searchParams.get('name') || 'Your Selection';
    const playlistImg = searchParams.get('img');

    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialName);

    const { playFromPlaylist } = usePlayControl();

    useEffect(() => {
        if (!token || !id) return;
        const load = async () => {
            try {
                const list = await fetchPlaylistTracks(token, id as string);
                setTracks(list);
            } catch (err) {
                console.error('로드 실패:', err);
                toast.error('트랙 정보를 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, token]);

    const handleUpdateName = async () => {
        if (!title.trim() || title === initialName) {
            setTitle(initialName);
            setIsEditing(false);
            return;
        }

        const previousTitle = title;

        try {
            setIsEditing(false);
            toast(
                (t) => (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                        }}
                    >
                        <FiCheckCircle size="1.6rem" color="#3b82f6" />
                        <span>플레이리스트 이름이 변경되었습니다.</span>
                    </div>
                ),
                { className: 'minimal-toast' },
            );

            await updatePlaylistName(token!, id as string, title);

            const newParams = new URLSearchParams(searchParams.toString());
            newParams.set('name', title);
            router.replace(`/playlist/${id}?${newParams.toString()}`, {
                scroll: false,
            });
        } catch (err: any) {
            setTitle(previousTitle);
            if (err.response?.status === 403) {
                toast.error(
                    '이름을 수정할 권한이 없습니다. 다시 로그인해주세요.',
                );
            } else {
                toast.error('이름 수정 중 오류가 발생했습니다.');
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleUpdateName();
        } else if (e.key === 'Escape') {
            setTitle(initialName);
            setIsEditing(false);
        }
    };

    const totalMs = tracks.reduce(
        (acc, track) => acc + (track.durationMs || 0),
        0,
    );
    const formatTotalDuration = (ms: number) => {
        if (!ms || ms <= 0) return '0분';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
    };

    return (
        <main className={styles.container}>
            <div className={styles.content}>
                {!isRelaxMode && (
                    <div className={styles.wrapper}>
                        <div className={styles.overlay}></div>

                        <nav className={styles.nav}>
                            <button
                                className={styles.backBtn}
                                onClick={() => router.back()}
                            >
                                <FaChevronLeft size={12} /> Back
                            </button>
                        </nav>

                        <header className={styles.hero}>
                            <div className={styles.heroArtWrapper}>
                                {playlistImg ? (
                                    <img
                                        src={playlistImg}
                                        alt="Cover"
                                        className={styles.heroArt}
                                    />
                                ) : (
                                    <div className={styles.emptyArt}>
                                        <FaMusic size={40} />
                                    </div>
                                )}
                            </div>
                            <div className={styles.heroText}>
                                <span className={styles.label}>PLAYLIST</span>

                                <div className={styles.titleContainer}>
                                    {isEditing ? (
                                        <div className={styles.editForm}>
                                            <input
                                                className={styles.titleInput}
                                                value={title}
                                                onChange={(e) =>
                                                    setTitle(e.target.value)
                                                }
                                                onKeyDown={handleKeyDown}
                                                onBlur={() =>
                                                    setIsEditing(false)
                                                }
                                                autoFocus
                                                spellCheck={false}
                                            />
                                            <div
                                                className={styles.editBtnGroup}
                                            >
                                                <button
                                                    onMouseDown={
                                                        handleUpdateName
                                                    }
                                                    className={
                                                        styles.editActionBtn
                                                    }
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button
                                                    onMouseDown={() => {
                                                        setTitle(initialName);
                                                        setIsEditing(false);
                                                    }}
                                                    className={`${styles.editActionBtn} ${styles.cancel}`}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <h2 className={styles.titleWrapper}>
                                            <span className={styles.titleText}>
                                                {title}
                                            </span>
                                            <FaRegEdit
                                                className={styles.editIcon}
                                                onClick={() =>
                                                    setIsEditing(true)
                                                }
                                            />
                                        </h2>
                                    )}
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.dot}>•</span>
                                    <span>{tracks.length} tracks</span>
                                    <span className={styles.dot}>•</span>
                                    <span>
                                        {loading
                                            ? '0시간 00분'
                                            : formatTotalDuration(totalMs)}
                                    </span>
                                </div>
                                <button
                                    className={styles.playBtn}
                                    onClick={() =>
                                        playFromPlaylist(tracks, 0, token!)
                                    }
                                >
                                    <FaPlay size={12} /> Play All
                                </button>
                            </div>
                        </header>

                        <section className={styles.listSection}>
                            <div className={styles.listHeader}>
                                <span className={styles.hNum}>#</span>
                                <span className={styles.hTitle}>TITLE</span>
                                <span className={styles.hArtist}>ARTIST</span>
                                <span className={styles.hTime}>TIME</span>
                            </div>

                            {loading ? (
                                <LoadingDots />
                            ) : (
                                <div className={styles.list}>
                                    {tracks.map((t, i) => (
                                        <div
                                            key={t.id}
                                            className={styles.row}
                                            onClick={() =>
                                                playFromPlaylist(
                                                    tracks,
                                                    i,
                                                    token!,
                                                )
                                            }
                                            style={{
                                                animationDelay: `${i * 0.05}s`,
                                            }}
                                        >
                                            <span className={styles.number}>
                                                {i + 1}
                                            </span>
                                            <div className={styles.trackMain}>
                                                <img
                                                    src={t.image}
                                                    alt={t.name}
                                                    className={styles.art}
                                                />
                                                <p className={styles.name}>
                                                    {t.name}
                                                </p>
                                            </div>
                                            <span className={styles.artist}>
                                                {t.artists.join(', ')}
                                            </span>
                                            <span className={styles.time}>
                                                {formatTime(t.durationMs)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </main>
    );
}
