"use client";

import Image from "next/image";
import { FiPlay, FiPlus } from "react-icons/fi";
import { SearchResult } from "@/types/api";
import styles from "./TrackList.module.css";
import { useSession } from "next-auth/react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useShallow } from "zustand/shallow";
import { formatTime } from "@/lib/formatTime";

interface TrackListProps {
  tracks: SearchResult[];
  onAdd: (uri: string) => void;
}

export default function TrackList({ tracks, onAdd }: TrackListProps) {
  const { data: session } = useSession();
  const { playSingleTrack } = usePlayerStore(
    useShallow((state) => ({
      playSingleTrack: state.playSingleTrack,
    })),
  );

  const handlePlayClick = (item: SearchResult) => {
    if (!session?.accessToken) return;

    // API 응답 데이터를 스토어 규격(Track)에 맞춰 변환
    const trackToPlay = {
      id: item.id,
      name: item.name,
      artists: item.artists || [],
      image: item.image,
      uri: item.uri,
      durationMs: item.durationMs || 0,
    };

    playSingleTrack(trackToPlay, session.accessToken);
  };

  return (
    <div className={styles.listContainer}>
      {tracks.map((item) => (
        <div
          key={item.id}
          className={styles.trackRow}
        >
          <div className={styles.trackLeading}>
            <div className={styles.trackImgWrapper}>
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="5.2rem"
                className={styles.trackImg}
              />
            </div>
            <div className={styles.trackMeta}>
              <p className={styles.name}>{item.name}</p>
              <p className={styles.artist}>{item.artists?.join(", ")}</p>
            </div>
          </div>

          <div className={styles.trackTrailing}>
            <span className={styles.duration}>{formatTime(item.durationMs)}</span>
            <div className={styles.trackActions}>
              <button
                className={styles.actionBtn}
                onClick={() => handlePlayClick(item)}
                title="재생"
              >
                <FiPlay />
              </button>
              <button
                className={styles.actionBtn}
                onClick={() => onAdd(item.uri)}
                title="추가"
              >
                <FiPlus />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
