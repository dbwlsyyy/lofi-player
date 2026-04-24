"use client";

import { useEffect, useState } from "react";
import { fetchPlaylists } from "@/apis/userApi";
import styles from "./AddToPlaylistModal.module.css";
import Image from "next/image";
import { SpotifyPlaylistItem } from "@/types/api";

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (playlistId: string) => void;
  accessToken: string;
}

export default function AddToPlaylistModal({
  isOpen,
  onClose,
  onSelect,
  accessToken,
}: AddModalProps) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylistItem[]>([]);

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchPlaylists(accessToken).then(setPlaylists).catch(console.error);
    }
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.content}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3>내 플레이리스트</h3>
          <p>어디에 담을까요?</p>
        </div>

        <div className={styles.list}>
          {playlists.map((pl) => (
            <button
              key={pl.id}
              className={styles.item}
              onClick={() => onSelect(pl.id)}
            >
              <div className={styles.imgBox}>
                <Image
                  src={pl.images?.[0]?.url || "/default_playlist.png"}
                  alt={pl.name}
                  fill
                  sizes="4.4rem"
                />
              </div>
              <span className={styles.name}>{pl.name}</span>
            </button>
          ))}
        </div>

        <button
          className={styles.closeBtn}
          onClick={onClose}
        >
          취소
        </button>
      </div>
    </div>
  );
}
