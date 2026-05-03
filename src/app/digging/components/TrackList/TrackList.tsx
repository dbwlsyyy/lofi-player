"use client";

import Image from "next/image";
import { FiHeart, FiPlay, FiPlus } from "react-icons/fi";
import { SearchResult } from "@/types/api";
import styles from "./TrackList.module.css";
import { useSession } from "next-auth/react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useShallow } from "zustand/shallow";
import { formatTime } from "@/lib/formatTime";
import TrackDropdown from "@/components/common/TrackDropdown/TrackDropdown";
import AddToPlaylistModal from "@/components/modal/AddToPlaylistModal/AddToPlaylistModal";
import { addTrackToPlaylist } from "@/apis/userApi";
import { uiToast } from "@/lib/toasts";
import { useState } from "react";
import { mapSdkTrackToLocalTrack, mapSearchResultToTrack } from "@/lib/spotifyMapper";

export default function TrackList({ tracks }: { tracks: SearchResult[] }) {
  const { data: session } = useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTrackUri, setTargetTrackUri] = useState("");

  const { playSingleTrack, addTrackToNext } = usePlayerStore(
    useShallow((state) => ({
      playSingleTrack: state.playSingleTrack,
      addTrackToNext: state.addTrackToNext,
    })),
  );

  const handlePlayClick = (item: SearchResult) => {
    if (!session?.accessToken) return;
    playSingleTrack(mapSearchResultToTrack(item), session.accessToken);
  };

  const handleAddNextClick = (item: SearchResult) => {
    addTrackToNext(mapSearchResultToTrack(item));
  };

  const handleAddClick = (uri: string) => {
    setTargetTrackUri(uri);
    setIsModalOpen(true);
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!session?.accessToken) return;
    try {
      await addTrackToPlaylist(session.accessToken, playlistId, targetTrackUri);
      setIsModalOpen(false);
      uiToast.success("내 플리에 추가 완료");
    } catch (error) {
      uiToast.error("곡 추가 실패");
    }
  };

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
                sizes="5.2rem"
                className={styles.trackImg}
              />
            </div>
            <div className={styles.trackMeta}>
              <p className={styles.name}>{item.name}</p>
              <p className={styles.artist}>{item.artists?.join(", ")}</p>
            </div>
          </div>

          <div className={styles.trackTrailing}>
            <span className={styles.duration}>{formatTime(item.durationMs)}</span>
            <div className={styles.trackActions}>
              <button
                className={styles.actionBtn}
                onClick={() => handlePlayClick(item)}
                title="재생"
              >
                <FiPlay />
              </button>
              <button
                className={styles.actionBtn}
                // onClick={() => }
                title="하트"
              >
                <FiHeart />
              </button>
              <div className={styles.dropdownWrapper}>
                <TrackDropdown
                  type="digging"
                  onPlayNext={() => handleAddNextClick(item)}
                  onSavePlaylist={() => handleAddClick(item.uri)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <AddToPlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectPlaylist}
        accessToken={session?.accessToken || ""}
      />
    </div>
  );
}
