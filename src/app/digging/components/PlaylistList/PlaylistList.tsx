"use client";

import Image from "next/image";
import { FiUser, FiDisc } from "react-icons/fi";
import { SearchResult } from "@/types/spotify";
import styles from "./PlaylistList.module.css";
import Link from "next/link";

interface PlaylistListProps {
  playlists: SearchResult[];
  onClick?: (id: string) => void;
}

export default function PlaylistList({ playlists, onClick }: PlaylistListProps) {
  return (
    <div className={styles.listContainer}>
      {playlists.map((item) => (
        <Link
          href={`/playlist/${item.id}`}
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
              <div className={styles.metaRowList}>
                <FiUser size="1.2rem" />
                <span>{item.owner}</span>
              </div>
            </div>
          </div>

          <div className={styles.trackTrailing}>
            <div className={styles.metaBadge}>
              <FiDisc size="1.2rem" />
              <span>{item.tracksTotal}곡</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
