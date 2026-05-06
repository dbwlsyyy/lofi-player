"use client";

import { fetchMyPlaylistList } from "@/apis/userApi";
import styles from "./AddToPlaylistModal.module.css";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

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
  const { data: playlists } = useQuery({
    queryKey: ["myPlaylists"],
    queryFn: ({ signal }) => fetchMyPlaylistList(accessToken!, signal),
    enabled: isOpen && !!accessToken, // 모달이 열려있을 때만 체크
    staleTime: 1000 * 60 * 5,
  });

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
          {playlists?.map((pl) => (
            <button
              key={pl.id}
              className={styles.item}
              onClick={() => onSelect(pl.id)}
            >
              <div className={styles.imgBox}>
                <Image
                  src={pl.image || "/default_playlist.png"}
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
