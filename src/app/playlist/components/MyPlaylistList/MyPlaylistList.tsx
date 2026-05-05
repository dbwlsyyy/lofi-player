"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaRegTrashAlt } from "react-icons/fa";
import { Track } from "@/types/player";
import { formatTime } from "@/lib/formatTime";
import { removeTrackFromPlaylist } from "@/apis/userApi";
import { usePlayerStore } from "@/store/usePlayerStore";
import { uiToast } from "@/lib/toasts";
import ConfirmModal from "@/components/modal/ConfirmModal/ConfirmModal";
import styles from "../../PlaylistDetail.module.css";

interface MyPlaylistListProps {
  playlistId: string;
  initialTracks: Track[];
}

export default function MyPlaylistList({ playlistId, initialTracks }: MyPlaylistListProps) {
  const token = usePlayerStore((state) => state.accessToken);
  const playSingleTrack = usePlayerStore((state) => state.playSingleTrack);
  
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrackUri, setSelectedTrackUri] = useState<string | null>(null);

  const handleRemoveClick = (e: React.MouseEvent, trackUri: string) => {
    e.stopPropagation();
    setSelectedTrackUri(trackUri);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTrackUri || !token) return;

    const previousTracks = [...tracks];
    setTracks(tracks.filter((t) => t.uri !== selectedTrackUri));
    setIsModalOpen(false);

    try {
      await removeTrackFromPlaylist(token, playlistId, selectedTrackUri);
      uiToast.success("곡이 삭제되었습니다.");
    } catch (err) {
      setTracks(previousTracks);
      uiToast.error("곡 삭제에 실패했습니다.");
    } finally {
      setSelectedTrackUri(null);
    }
  };

  return (
    <>
      <section className={styles.listSection}>
        <div className={styles.listHeader}>
          <span className={styles.hNum}>#</span>
          <span className={styles.hTitle}>TITLE</span>
          <span className={styles.hArtist}>ARTIST</span>
          <span className={styles.hTime}>TIME</span>
          <span className={styles.hEmpty}></span>
        </div>

        <div className={styles.list}>
          {tracks.map((t, i) => (
            <div
              key={t.uniqueKey || t.id}
              className={styles.row}
              onClick={() => playSingleTrack(t)}
              style={{
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <span className={styles.number}>{i + 1}</span>
              <div className={styles.trackMain}>
                <Link
                  href={`/song/${t.id}`}
                  className={styles.artWrapper}
                  onClick={(e) => e.stopPropagation()}
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
      </section>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="곡 삭제 확인"
        message="이 곡을 플레이리스트에서 삭제할까요?"
        confirmText="삭제하기"
        type="danger"
      />
    </>
  );
}
