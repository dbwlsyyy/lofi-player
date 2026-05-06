"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaRegTrashAlt } from "react-icons/fa";
import { Track } from "@/types/domainTypes";
import { formatTime } from "@/lib/formatTime";
import { removeTrackFromPlaylist } from "@/apis/userApi";
import { usePlayerStore } from "@/store/usePlayerStore";
import { uiToast } from "@/lib/toasts";
import ConfirmModal from "@/components/modal/ConfirmModal/ConfirmModal";
import styles from "./MyPlaylistList.module.css";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useShallow } from "zustand/shallow";

interface MyPlaylistListProps {
  playlistId: string;
  initialTracks: Track[];
}

export default function MyPlaylistList({ playlistId, initialTracks: tracks }: MyPlaylistListProps) {
  const { token, playSingleTrack } = usePlayerStore(
    useShallow((state) => ({
      token: state.accessToken,
      playSingleTrack: state.playSingleTrack,
    })),
  );

  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrackUri, setSelectedTrackUri] = useState<string | null>(null);

  // Window 가상화를 위한 Ref와 Offset 설정
  const listRef = useRef<HTMLDivElement>(null);
  const [listOffset, setListOffset] = useState(0);

  // 화면이 다 그려진(Mount) 직후에 헤더 높이를 가져와서 저장
  useEffect(() => {
    if (listRef.current) {
      setListOffset(listRef.current.offsetTop);
    }
  }, []); // 빈 배열을 넣어서 처음에 딱 한 번만 계산

  // 안전하게 상태(listOffset)를 가상화에 넣어줌
  const rowVirtualizer = useWindowVirtualizer({
    count: tracks.length,
    estimateSize: () => 68,
    overscan: 5,
    scrollMargin: listOffset,
  });

  // 곡 삭제 Mutation (전역 캐시 직접 수정 = 낙관적 업데이트)
  const deleteMutation = useMutation({
    mutationFn: (trackUri: string) => removeTrackFromPlaylist(token!, playlistId, trackUri),
    onMutate: async (deletedUri) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["playlistTracks", playlistId] });
      // 캐시 스냅샷 저장
      const previousTracks = queryClient.getQueryData<Track[]>(["playlistTracks", playlistId]);

      // 캐시 업데이트 (화면 즉시 변경)
      if (previousTracks) {
        queryClient.setQueryData<Track[]>(["playlistTracks", playlistId], (old) => {
          return old?.filter((t) => t.uri !== deletedUri) || [];
        });
      }
      return { previousTracks };
    },
    onError: (err, deletedUri, context) => {
      // 에러 시 스냅샷으로 롤백
      if (context?.previousTracks) {
        queryClient.setQueryData(["playlistTracks", playlistId], context.previousTracks);
      }
      uiToast.error("곡 삭제에 실패했습니다.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPlaylists"] });
      uiToast.success("곡이 삭제되었습니다.");
    },
    onSettled: () => {
      setIsModalOpen(false);
      setSelectedTrackUri(null);
    },
  });

  const handleRemoveClick = (e: React.MouseEvent, trackUri: string) => {
    e.stopPropagation();
    setSelectedTrackUri(trackUri);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedTrackUri) return;
    deleteMutation.mutate(selectedTrackUri);
  };

  return (
    <section className={styles.listSection}>
      <div className={styles.listHeader}>
        <span className={styles.hNum}>#</span>
        <span className={styles.hTitle}>TITLE</span>
        <span className={styles.hArtist}>ARTIST</span>
        <span className={styles.hTime}>TIME</span>
        <span className={styles.hEmpty}></span>
      </div>

      {/* Window 가상화를 위한 시작점 지정 */}
      <div ref={listRef}>
        <div
          className={styles.list}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`, // 전체 스크롤 길이를 잡아줌
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const t = tracks[virtualRow.index]!;
            return (
              /* 가상화 위치를 책임지는 '투명 껍데기' (CSS 충돌 방지) */
              <div
                key={t.uniqueKey || t.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  // 전체 화면 기준이므로, 스크롤 마진(헤더 높이)을 빼서 위치를 보정
                  transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                }}
              >
                <div
                  className={styles.row}
                  onClick={() => playSingleTrack(t)}
                  style={{
                    height: "100%",
                    animation: "none", // 스크롤 시 번쩍거림 방지
                    opacity: 1, // 투명도 고정
                  }}
                >
                  <span className={styles.number}>{virtualRow.index + 1}</span>

                  <div className={styles.trackMain}>
                    <Link
                      href={`/song/${t.id}`}
                      className={styles.artWrapper}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Image
                        src={t.image || "/default_album.png"}
                        alt={t.name}
                        fill
                        sizes="4.4rem"
                        className={styles.art}
                      />
                    </Link>
                    <p className={styles.name}>{t.name}</p>
                  </div>

                  <span className={styles.artist}>{t.artists.join(", ")}</span>
                  <span className={styles.time}>{formatTime(t.durationMs)}</span>

                  <button
                    className={styles.removeBtn}
                    onClick={(e) => handleRemoveClick(e, t.uri)}
                    title="곡 삭제"
                  >
                    <FaRegTrashAlt />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="곡 삭제 확인"
        message="이 곡을 플레이리스트에서 삭제할까요?"
        confirmText="삭제하기"
        type="danger"
      />
    </section>
  );
}
