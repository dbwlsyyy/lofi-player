"use client";
import Image from "next/image";
import styles from "./ArtistGrid.module.css";
import Link from "next/link";
import { SpotifyArtistDetailed } from "@/types/spotify";

export default function ArtistGrid({ artists }: { artists: SpotifyArtistDetailed[] }) {
  return (
    <div className={styles.gridContainer}>
      {artists.map((item) => (
        <Link
          href={`/artist/${item.id}`}
          key={item.id}
          className={styles.artistCard}
        >
          <div className={styles.artistImgWrapper}>
            <Image
              src={item.images[0]?.url || "/default_artist.png"}
              alt={item.name}
              fill
              sizes="15rem"
              className={styles.artistImg}
            />
          </div>
          <p className={styles.artistName}>{item.name}</p>
        </Link>
      ))}
    </div>
  );
}
