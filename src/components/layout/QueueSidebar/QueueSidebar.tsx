"use client";
import { usePlayerStore } from "@/store/usePlayerStore";
import styles from "./QueueSidebar.module.css";
import { useEffect, useRef } from "react";
import { usePlayControl } from "@/hooks/usePlayTracks";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/useUiStore";
import Image from "next/image";

export default function QueueSidebar() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const router = useRouter();
  const { queue, currentIndex, currentTrack } = usePlayerStore();
  const { isSidebarOpen } = useUIStore();
  const { playFromPlaylist } = usePlayControl();

  useEffect(() => {
    itemRefs.current[currentIndex] &&
      itemRefs.current[currentIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [currentIndex]);

  return (
    <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>
      <h2 className={styles.title}>Playlist</h2>
      {currentTrack && (
        <>
          <div className={styles.sectionTitle}>지금 재생 중</div>

          <div
            className={`${styles.item} ${styles.active}`}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/song/${currentTrack.id}`);
            }}
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
          </div>
        </>
      )}
      <div className={styles.sectionTitle}>현재 재생목록</div>

      <div className={styles.list}>
        {queue.map((track, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={track.id + index}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              onClick={() => playFromPlaylist(queue, index, token!)}
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
              {isActive && (
                <div className={styles.eqWrapper}>
                  <div className={styles.eqBarBlack}></div>
                  <div className={styles.eqBarBlack}></div>
                  <div className={styles.eqBarBlack}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
