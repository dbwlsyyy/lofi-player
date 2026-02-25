// ArtistGrid.tsx
"use client";
import Image from "next/image";
import styles from "../Digging.module.css";

export default function ArtistGrid({ artists, onClick }: { artists: any[]; onClick: any }) {
  return (
    <div className={styles.gridContainer}>
      {artists.map((item) => (
        <div
          key={item.id}
          className={styles.artistCard}
          onClick={onClick}
        >
          <div className={styles.artistImgWrapper}>
            <Image
              src={item.image}
              alt={item.name}
              fill
              className={styles.artistImg}
            />
          </div>
          <p className={styles.artistName}>{item.name}</p>
        </div>
      ))}
    </div>
  );
}
