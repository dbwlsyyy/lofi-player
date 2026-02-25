"use client";

import Image from "next/image";
import { FiUser, FiMusic, FiDisc } from "react-icons/fi";
import { SearchResult } from "@/apis/spotifyUserApi";
import styles from "../Digging.module.css";

interface PlaylistListProps {
  playlists: SearchResult[];
  onClick: (id: string) => void;
}

export default function PlaylistList({ playlists, onClick }: PlaylistListProps) {
  return (
    <div className={styles.listContainer}>
      {playlists.map((item) => (
        <div
          key={item.id}
          className={styles.trackRow}
          onClick={() => onClick(item.id)}
          style={{ cursor: "pointer" }}
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
              <div className={styles.metaRowList}>
                <FiUser size="1.2rem" />
                <span>{item.owner}</span>
              </div>
            </div>
          </div>

          <div className={styles.trackTrailing}>
            <div className={styles.metaBadge}>
              <FiDisc size="1.2rem" />
              {/* 곡 수 표시 */}
              <span>{item.tracksTotal}곡</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
