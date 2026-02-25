"use client";

import { SearchFilter } from "@/apis/spotifyUserApi";
import styles from "../Digging.module.css";

interface FilterBarProps {
  filter: SearchFilter;
  setFilter: (f: SearchFilter) => void;
}

export default function FilterBar({ filter, setFilter }: FilterBarProps) {
  const filters: { key: SearchFilter; label: string }[] = [
    { key: "track", label: "곡" },
    { key: "artist", label: "아티스트" },
    { key: "album", label: "앨범" },
    { key: "playlist", label: "플레이리스트" },
  ];

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterGroup}>
        {filters.map((f) => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.active : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
