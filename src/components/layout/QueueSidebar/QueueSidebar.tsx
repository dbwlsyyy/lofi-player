"use client";
import { usePlayerStore } from "@/store/usePlayerStore";
import styles from "./QueueSidebar.module.css";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useUiStore } from "@/store/useUiStore";
import Image from "next/image";
import Link from "next/link";
import { useShallow } from "zustand/shallow";
import TrackDropdown from "@/components/common/TrackDropdown/TrackDropdown";
import AddToPlaylistModal from "@/components/modal/AddToPlaylistModal/AddToPlaylistModal";
import { uiToast } from "@/lib/toasts";
import { addTrackToPlaylist } from "@/apis/userApi";

export default function QueueSidebar() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTrackUri, setTargetTrackUri] = useState("");

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { isSidebarOpen } = useUiStore();
  const {
    queue,
    currentIndex,
    currentTrack,
    activeUniqueKey,
    jumpTo,
    removeTrackFromQueue,
    clearQueue,
  } = usePlayerStore(
    useShallow((state) => ({
      queue: state.queue,
      currentIndex: state.currentIndex,
      currentTrack: state.currentTrack,
      jumpTo: state.jumpTo,
      removeTrackFromQueue: state.removeTrackFromQueue,
      clearQueue: state.clearQueue,
      activeUniqueKey: state.activeUniqueKey,
    })),
  );

  useEffect(() => {
    itemRefs.current[currentIndex] &&
      itemRefs.current[currentIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [currentIndex]);

  const handleAddClick = (uri: string) => {
    setTargetTrackUri(uri);
    setIsModalOpen(true);
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!session?.accessToken) return;
    try {
      await addTrackToPlaylist(session.accessToken, playlistId, targetTrackUri);
      setIsModalOpen(false);
      uiToast.success("내 플리에 추가 완료!");
    } catch (error) {
      uiToast.error("곡 추가 실패!");
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>
      <h2 className={styles.title}>Playlist</h2>
      {currentTrack && (
        <>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>지금 재생 중</div>
          </div>
          <Link
            href={`/song/${currentTrack.id}`}
            className={`${styles.item} ${styles.active}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.thumbWrapper}>
              <Image
                src={currentTrack.image || "/default_playlist.png"}
                alt={currentTrack.name}
                fill
                priority
                sizes="4rem"
                className={styles.thumb}
              />
            </div>
            <div className={styles.textGroup}>
              <div className={styles.titleText}>{currentTrack.name}</div>
              <div className={styles.artistText}>{currentTrack.artists.join(", ")}</div>
            </div>

            <div className={styles.eqWrapper}>
              <div className={styles.eqBar}></div>
              <div className={styles.eqBar}></div>
              <div className={styles.eqBar}></div>
            </div>
          </Link>
        </>
      )}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>현재 재생목록</div>
        <button
          onClick={clearQueue}
          className={styles.clearBtn}
        >
          비우기
        </button>
      </div>

      <div className={styles.list}>
        {queue.map((track, index) => {
          const isActive = track.uniqueKey === activeUniqueKey;

          return (
            <div
              key={track.uniqueKey}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              onClick={() => jumpTo(index, token!)}
              className={`${styles.item} ${isActive ? styles.activeBlack : ""}`}
            >
              <div className={styles.thumbWrapper}>
                <Image
                  src={track.image || "/default_album.png"}
                  alt={track.name}
                  fill
                  sizes="4rem"
                  className={styles.thumb}
                />
              </div>

              <div className={styles.textGroup}>
                <div className={styles.titleText}>{track.name}</div>
                <div className={styles.artistText}>{track.artists.join(", ")}</div>
              </div>

              <div className={styles.dropdownWrapper}>
                <TrackDropdown
                  type="queue"
                  onRemove={() => removeTrackFromQueue(index, token!)}
                  onSavePlaylist={() => handleAddClick(track.uri)}
                />
              </div>
            </div>
          );
        })}
      </div>
      <AddToPlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectPlaylist}
        accessToken={session?.accessToken || ""}
      />
    </aside>
  );
}
