"use client";

import Image from "next/image";
import { FiPlay, FiPlus } from "react-icons/fi";
import { SearchResult } from "@/apis/spotifyUserApi";
import styles from "../Digging.module.css";

interface TrackListProps {
  tracks: SearchResult[];
  onPlay: (item: SearchResult) => void;
  onAdd: (uri: string) => void;
}

// ms -> mm:ss 변환 함수
const formatDuration = (ms?: number) => {
  if (!ms) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}`;
};

export default function TrackList({ tracks, onPlay, onAdd }: TrackListProps) {
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
                className={styles.trackImg}
              />
            </div>
            <div className={styles.trackMeta}>
              <p className={styles.name}>{item.name}</p>
              <p className={styles.artist}>{item.artists?.join(", ")}</p>
            </div>
          </div>

          <div className={styles.trackTrailing}>
            <span className={styles.duration}>{formatDuration(item.durationMs)}</span>
            <div className={styles.trackActions}>
              <button
                className={styles.actionBtn}
                onClick={() => onPlay(item)}
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
