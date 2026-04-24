"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { FiChevronDown } from "react-icons/fi";
import styles from "../Digging.module.css";
import { SearchResult } from "@/types/api";

interface AlbumGridProps {
  albums: SearchResult[];
  onClick: (id: string) => void;
}

type SortOption = "latest" | "oldest";

export default function AlbumGrid({ albums, onClick }: AlbumGridProps) {
  const [sortOrder, setSortOrder] = useState<SortOption>("latest");

  // 단순 정렬 (그룹핑 제거)
  const sortedAlbums = useMemo(() => {
    return [...albums].sort((a, b) => {
      const dateA = new Date(a.releaseDate || "0000").getTime();
      const dateB = new Date(b.releaseDate || "0000").getTime();
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });
  }, [albums, sortOrder]);

  return (
    <div className={styles.gridWrapper}>
      {/* 정렬 드롭다운 */}
      <div className={styles.subFilter}>
        <div className={styles.customSelectWrapper}>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOption)}
            className={styles.customSelect}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
          <FiChevronDown className={styles.selectIcon} />
        </div>
      </div>

      {/* 연속 그리드 (Continuous Grid) */}
      <div className={styles.gridContainer}>
        {sortedAlbums.map((item) => (
          <div
            key={item.id}
            className={styles.albumCard}
            onClick={() => onClick(item.id)}
          >
            <div className={styles.albumImgWrapper}>
              <Image
                src={item.image}
                alt={item.name}
                fill
                className={styles.albumImg}
              />

              {/* 연도 배지 (이미지 위에 오버레이) */}
              <div className={styles.yearBadge}>
                {item.releaseDate?.split("-")[0]}
              </div>
            </div>

            <div className={styles.cardInfo}>
              <p className={styles.albumName}>{item.name}</p>
              <p className={styles.albumArtist}>{item.artists?.join(", ")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
