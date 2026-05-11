"use client";
import { usePlayerStore } from "@/store/usePlayerStore";
import { createPortal } from "react-dom";
import styles from "./QueueSidebar.module.css";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useUiStore } from "@/store/useUiStore";
import Image from "next/image";
import Link from "next/link";
import { useShallow } from "zustand/shallow";
import TrackDropdown from "@/components/common/TrackDropdown/TrackDropdown";
import dynamic from "next/dynamic";
import { uiToast } from "@/lib/toasts";
import { addTrackToPlaylist } from "@/apis/userApi";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const AddToPlaylistModal = dynamic(
  () => import("@/components/modal/AddToPlaylistModal/AddToPlaylistModal"),
  { ssr: false },
);

export default function QueueSidebar() {
  const queryClient = useQueryClient();

  const { isSidebarOpen } = useUiStore();
  const accessToken = usePlayerStore((state) => state.accessToken);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTrackUri, setTargetTrackUri] = useState("");

  const parentRef = useRef<HTMLDivElement>(null);

  const {
    queue,
    currentIndex,
    currentTrack,
    activeUniqueKey,
    jumpTo,
    removeTrackFromQueue,
    clearQueue,
  } = usePlayerStore(
    useShallow((state) => ({
      queue: state.queue,
      currentIndex: state.currentIndex,
      currentTrack: state.currentTrack,
      jumpTo: state.jumpTo,
      removeTrackFromQueue: state.removeTrackFromQueue,
      clearQueue: state.clearQueue,
      activeUniqueKey: state.activeUniqueKey,
    })),
  );

  const virtualizer = useVirtualizer({
    count: queue.length, // 전체 곡 개수
    getScrollElement: () => parentRef.current, // 스크롤바가 생기는 껍데기 박스
    estimateSize: () => 64, // 곡 1줄의 대략적인 높이 (4rem 썸네일 + 패딩 고려 = 약 64px)
    overscan: 5, // 위아래로 5개씩 여유분 렌더링 (스크롤 시 하얀 화면 방지)
  });

  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < queue.length) {
      virtualizer.scrollToIndex(currentIndex, {
        behavior: "smooth",
        align: "center",
      });
    }
  }, [currentIndex, queue.length, virtualizer]);

  const handleAddClick = (uri: string) => {
    setTargetTrackUri(uri);
    setIsModalOpen(true);
  };

  const { mutate: addTrackMutation } = useMutation({
    mutationFn: (playlistId: string) =>
      addTrackToPlaylist(accessToken || "", playlistId, targetTrackUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPlaylists"] });
      setIsModalOpen(false);
      uiToast.success("내 플리에 추가 완료");
    },
    onError: () => {
      uiToast.error("곡 추가 실패");
    },
  });

  const handleSelectPlaylist = (playlistId: string) => {
    if (accessToken) return;
    addTrackMutation(playlistId);
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>
        <h2 className={styles.title}>Playlist</h2>
        {currentTrack && (
          <>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>지금 재생 중</div>
            </div>
            <Link
              href={`/song/${currentTrack.id}`}
              className={`${styles.item} ${styles.active}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.thumbWrapper}>
                <Image
                  src={currentTrack.image || "/default_playlist.png"}
                  alt={currentTrack.name}
                  fill
                  priority
                  sizes="4rem"
                  className={styles.thumb}
                />
              </div>
              <div className={styles.textGroup}>
                <div className={styles.titleText}>{currentTrack.name}</div>
                <div className={styles.artistText}>{currentTrack.artists.join(", ")}</div>
              </div>

              <div className={styles.eqWrapper}>
                <div className={styles.eqBar}></div>
                <div className={styles.eqBar}></div>
                <div className={styles.eqBar}></div>
              </div>
            </Link>
          </>
        )}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>현재 재생목록</div>
          <button
            onClick={clearQueue}
            className={styles.clearBtn}
          >
            비우기
          </button>
        </div>

        <div
          className={styles.list}
          ref={parentRef}
        >
          {/* 가상 높이를 잡아주는 투명 기둥 */}
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {/* 눈에 보이는 아이템만 뽑아서 렌더링 */}
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const track = queue[virtualItem.index]!;
              const isActive = track?.uniqueKey === activeUniqueKey;

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                    zIndex: queue.length - virtualItem.index,
                  }}
                >
                  <div
                    onClick={() => jumpTo(virtualItem.index)}
                    className={`${styles.item} ${isActive ? styles.activeBlack : ""}`}
                  >
                    <div className={styles.thumbWrapper}>
                      <Image
                        src={track.image || "/default_album.png"}
                        alt={track.name}
                        fill
                        sizes="4rem"
                        className={styles.thumb}
                      />
                    </div>

                    <div className={styles.textGroup}>
                      <div className={styles.titleText}>{track.name}</div>
                      <div className={styles.artistText}>{track.artists.join(", ")}</div>
                    </div>

                    <div className={styles.dropdownWrapper}>
                      <TrackDropdown
                        type="queue"
                        onRemove={(e) => {
                          e.stopPropagation(); //  아이템 클릭(jumpTo) 이벤트 전파 방지
                          removeTrackFromQueue(virtualItem.index);
                        }}
                        onSavePlaylist={(e) => {
                          e.stopPropagation();
                          handleAddClick(track.uri);
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
      {typeof window !== "undefined" &&
        isModalOpen &&
        createPortal(
          <AddToPlaylistModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelect={handleSelectPlaylist}
            accessToken={accessToken || ""}
          />,
          document.body,
        )}
    </>
  );
}
