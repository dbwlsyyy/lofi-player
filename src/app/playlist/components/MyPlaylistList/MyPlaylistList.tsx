"use client";

import Image from "next/image";
import Link from "next/link";
import { FaRegTrashAlt } from "react-icons/fa";
import { Track } from "@/types/player";
import { formatTime } from "@/lib/formatTime";
import styles from "../../PlaylistDetail.module.css";

interface MyPlaylistListProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onRemoveClick: (e: React.MouseEvent, trackUri: string) => void;
}

export default function MyPlaylistList({ tracks, onPlayTrack, onRemoveClick }: MyPlaylistListProps) {
  return (
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
            onClick={() => onPlayTrack(t)}
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
              onClick={(e) => onRemoveClick(e, t.uri)}
              title="곡 삭제"
            >
              <FaRegTrashAlt />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
