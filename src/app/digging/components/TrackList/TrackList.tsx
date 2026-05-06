"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FiHeart, FiPlay } from "react-icons/fi";
import { Track } from "@/types/domainTypes";
import styles from "./TrackList.module.css";
import { useSession } from "next-auth/react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useShallow } from "zustand/shallow";
import { formatTime } from "@/lib/formatTime";
import TrackDropdown from "@/components/common/TrackDropdown/TrackDropdown";
import dynamic from "next/dynamic";

import { addTrackToPlaylist } from "@/apis/userApi";
import { uiToast } from "@/lib/toasts";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

const AddToPlaylistModal = dynamic(
  () => import("@/components/modal/AddToPlaylistModal/AddToPlaylistModal"),
  { ssr: false },
);

export default function TrackList({ tracks }: { tracks: Track[] }) {
  const { data: session } = useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTrackUri, setTargetTrackUri] = useState("");

  // 가상화 위치 계산을 위한 Ref와 Offset 상태
  const listRef = useRef<HTMLDivElement>(null);
  const [listOffset, setListOffset] = useState(0);

  // 화면이 다 그려진 후 리스트의 시작 높이(Offset)를 계산
  useEffect(() => {
    if (listRef.current) {
      setListOffset(listRef.current.offsetTop);
    }
  }, []);

  // 윈도우 스크롤 가상화 설정
  const rowVirtualizer = useWindowVirtualizer({
    count: tracks.length,
    estimateSize: () => 80, // 이미지 5.2rem 기반 계산된 높이
    overscan: 5,
    scrollMargin: listOffset,
  });

  const { playSingleTrack, addTrackToNext } = usePlayerStore(
    useShallow((state) => ({
      playSingleTrack: state.playSingleTrack,
      addTrackToNext: state.addTrackToNext,
    })),
  );

  const handlePlayClick = (track: Track) => {
    playSingleTrack(track);
  };

  const handleAddNextClick = (track: Track) => {
    addTrackToNext(track);
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
    <div
      className={styles.listContainer}
      ref={listRef}
    >
      {/* 가상화 영역의 전체 높이를 잡아주는 컨테이너 */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = tracks[virtualRow.index]!;
          return (
            /* 위치를 잡는 투명 껍데기 */
            <div
              key={item.uniqueKey || item.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${
                  virtualRow.start - rowVirtualizer.options.scrollMargin
                }px)`,
              }}
            >
              <div
                className={styles.trackRow}
                style={{
                  height: "100%",
                  animation: "none",
                  opacity: 1,
                }}
              >
                <div className={styles.trackLeading}>
                  <div className={styles.trackImgWrapper}>
                    <Image
                      src={item.image || "/default_album.png"}
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
            </div>
          );
        })}
      </div>

      <AddToPlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectPlaylist}
        accessToken={session?.accessToken || ""}
      />
    </div>
  );
}
