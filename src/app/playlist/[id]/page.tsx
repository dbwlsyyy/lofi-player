"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, KeyboardEvent } from "react";
import styles from "./PlaylistDetail.module.css";
import { fetchPlaylistTracks, removeTrackFromPlaylist, updatePlaylistName } from "@/apis/userApi";
import { useSession } from "next-auth/react";
import { usePlayControl } from "@/hooks/usePlayTracks";
import { useUIStore } from "@/store/useUiStore";
import { FaPlay, FaRegEdit, FaCheck, FaTimes, FaRegTrashAlt } from "react-icons/fa";
import LoadingDots from "@/components/loading/LoadingDots/LoadingDots";
import { formatTime, formatTotalDuration } from "@/lib/formatTime";
import ConfirmModal from "@/components/modal/ConfirmModal/ConfirmModal";
import { Track } from "@/types/player";
import { uiToast } from "@/lib/toasts";
import Image from "next/image";
import Link from "next/link";

export default function PlaylistDetailPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isRelaxMode } = useUIStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const playlistName = searchParams.get("name") || "Your Selection";
  const playlistImg = searchParams.get("img");

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(playlistName);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrackUri, setSelectedTrackUri] = useState<string | null>(null);

  const { playFromPlaylist } = usePlayControl();

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const lists = await fetchPlaylistTracks(token, id as string);
        if (cancelled) return;

        const tracksWithKey = lists.map((track) => ({
          ...track,
          uniqueKey: crypto.randomUUID(),
        }));
        setTracks(tracksWithKey);
      } catch (err) {
        if (cancelled) return;

        console.error("로드 실패:", err);
        uiToast.error("트랙 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
  }, [id, token]);

  useEffect(() => {
    setTitle(playlistName); // URL 변경 시 로컬 상태(title)를 최신 정보로 동기화
  }, [playlistName]);

  const handleUpdateName = async () => {
    if (!title.trim() || title === playlistName) {
      setTitle(playlistName);
      setIsEditing(false);
      return;
    }

    const previousTitle = title;

    try {
      setIsEditing(false);

      await updatePlaylistName(token!, id as string, title);
      uiToast.success("플레이리스트 이름이 변경되었습니다.");

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("name", title);
      router.replace(`/playlist/${id}?${newParams.toString()}`, {
        scroll: false,
      });
    } catch (err: any) {
      setTitle(previousTitle);
      if (err.response?.status === 403) {
        uiToast.error("이름을 수정할 권한이 없습니다. 다시 로그인해주세요.");
      } else {
        uiToast.error("이름 수정 중 오류가 발생했습니다.");
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUpdateName();
    } else if (e.key === "Escape") {
      setTitle(playlistName);
      setIsEditing(false);
    }
  };

  const totalMs = tracks.reduce((acc, track) => acc + (track.durationMs || 0), 0);

  const handleRemoveClick = (e: React.MouseEvent, trackUri: string) => {
    e.stopPropagation();
    setSelectedTrackUri(trackUri);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTrackUri) return;

    const previousTracks = [...tracks];
    // 낙관적 업데이트
    setTracks(tracks.filter((t) => t.uri !== selectedTrackUri));
    setIsModalOpen(false); // 모달 닫기

    try {
      await removeTrackFromPlaylist(token!, id as string, selectedTrackUri);
      uiToast.success("곡이 삭제되었습니다.");
    } catch (err) {
      setTracks(previousTracks); // 실패 시 복구
      uiToast.error("곡 삭제에 실패했습니다.");
    } finally {
      setSelectedTrackUri(null);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {!isRelaxMode && (
          <div className={styles.wrapper}>
            <div className={styles.overlay}></div>

            <header className={styles.hero}>
              <div className={styles.heroArtWrapper}>
                <Image
                  src={playlistImg || "/default_playlist.png"}
                  alt={`${playlistName} 앨범 커버`}
                  fill
                  priority
                  sizes="24rem"
                  className={styles.heroArt}
                />
              </div>
              <div className={styles.heroText}>
                <span className={styles.label}>PLAYLIST</span>

                <div className={styles.titleContainer}>
                  {isEditing ? (
                    <div className={styles.editForm}>
                      <input
                        className={styles.titleInput}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                        spellCheck={false}
                      />

                      <div className={styles.editBtnGroup}>
                        <button
                          onMouseDown={handleUpdateName}
                          className={styles.editActionBtn}
                        >
                          <FaCheck />
                        </button>
                        <button
                          onMouseDown={() => {
                            setTitle(playlistName);
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
                      <span className={styles.titleText}>{title}</span>
                      <FaRegEdit
                        className={styles.editIcon}
                        onClick={() => setIsEditing(true)}
                      />
                    </h2>
                  )}
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.dot}>•</span>
                  <span>{tracks.length} tracks</span>
                  <span className={styles.dot}>•</span>
                  <span>{loading ? "0시간 00분" : formatTotalDuration(totalMs)}</span>
                </div>

                <button
                  className={styles.playBtn}
                  onClick={() => playFromPlaylist(tracks, 0, token!)}
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
                <span className={styles.hEmpty}></span>
              </div>

              {loading ? (
                <div className={styles.loading}>
                  <LoadingDots />
                </div>
              ) : (
                <div className={styles.list}>
                  {tracks.map((t, i) => (
                    <div
                      key={t.uniqueKey}
                      className={styles.row}
                      onClick={() => playFromPlaylist(tracks, i, token!)}
                      style={{
                        animationDelay: `${i * 0.05}s`,
                      }}
                    >
                      <span className={styles.number}>{i + 1}</span>
                      <div className={styles.trackMain}>
                        <Link
                          href={`/song/${t.id}`}
                          className={styles.artWrapper}
                        >
                          <Image
                            src={t.image || "/default_album.png"}
                            alt={t.name}
                            fill
                            sizes="4.4rem"
                            className={styles.art}
                          />
                        </Link>
                        <p className={styles.name}>{t.name}</p>
                      </div>

                      <span className={styles.artist}>{t.artists.join(", ")}</span>
                      <span className={styles.time}>{formatTime(t.durationMs)}</span>

                      <button
                        className={styles.removeBtn}
                        onClick={(e) => handleRemoveClick(e, t.uri)}
                        title="곡 삭제"
                      >
                        <FaRegTrashAlt />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="곡 삭제 확인"
        message="이 곡을 플레이리스트에서 삭제할까요?"
        confirmText="삭제하기"
        type="danger"
      />
    </main>
  );
}
