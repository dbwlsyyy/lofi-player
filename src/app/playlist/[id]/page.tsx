"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, KeyboardEvent } from "react";
import styles from "./PlaylistDetail.module.css";
import { updatePlaylistName, fetchMe, fetchAllTracksInPlaylist } from "@/apis/userApi";
import { fetchPlaylistMetadata } from "@/apis/diggingApi";
import { useUiStore } from "@/store/useUiStore";
import { FaPlay, FaRegEdit, FaCheck, FaTimes } from "react-icons/fa";
import LoadingDots from "@/components/loading/LoadingDots/LoadingDots";
import { formatTotalDuration } from "@/lib/formatTime";
import { uiToast } from "@/lib/toasts";
import Image from "next/image";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useShallow } from "zustand/shallow";
import MyPlaylistList from "../components/MyPlaylistList/MyPlaylistList";
import TrackList from "@/app/digging/components/TrackList/TrackList";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ErrorUi from "@/components/common/ErrorUi/ErrorUi";

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const playlistId = id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { isRelaxMode } = useUiStore();
  const { token, playAllTracks } = usePlayerStore(
    useShallow((state) => ({
      token: state.accessToken,
      playAllTracks: state.playAllTracks,
    })),
  );

  const playlistImgFromUrl = searchParams.get("img");

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");

  //  내 정보 가져오기 (캐시를 무한대로 설정해서 통신 낭비 방지)
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: ({ signal }) => fetchMe(token!, signal),
    enabled: !!token,
    staleTime: Infinity,
  });

  // 플레이리스트 기본 정보 가져오기
  const {
    data: playlistInfo,
    isLoading: isPlaylistLoading,
    error,
  } = useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: ({ signal }) => fetchPlaylistMetadata(token!, playlistId, signal),
    enabled: !!token && !!playlistId,
  });

  // 내 플레이리스트인지 판별

  // 내 플리/남의 플리 따지지 말고 무조건 '전체 트랙' API 호출
  const {
    data: allTracks,
    isLoading: isTracksLoading,
    status,
    fetchStatus,
  } = useQuery({
    queryKey: ["playlistTracks", playlistId],
    queryFn: ({ signal }) => fetchAllTracksInPlaylist(token!, playlistId, signal), // 여기서 while 루프가 돌아가며 다 긁어옴
    enabled: !!token && !!playlistId,
  });

  // 내 플레이리스트인지 판별
  const isMine = !!me && !!playlistInfo && me.id === playlistInfo.ownerId;

  // 화면에 뿌려줄 트랙은 allTracks 사용
  const tracks = allTracks || [];

  // 이름 변경 기능 (Mutation + 캐시 직접 수정)
  const updateNameMutation = useMutation({
    mutationFn: (newName: string) => updatePlaylistName(token!, playlistId, newName),
    onSuccess: (_, newName) => {
      uiToast.success("플레이리스트 이름이 변경되었습니다.");

      // 서버에서 데이터를 다시 안 받아와도 캐시를 덮어씌워서 화면을 즉시 바꿈
      queryClient.setQueryData(["playlist", playlistId], (old: any) =>
        old ? { ...old, name: newName } : old,
      );

      setIsEditing(false);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("name", newName);
      router.replace(`/playlist/${playlistId}?${newParams.toString()}`, { scroll: false });
    },
    onError: () => {
      setIsEditing(false);
    },
  });

  // --- 이벤트 핸들러 ---
  const handleEditStart = () => {
    setTitle(playlistInfo?.name || "");
    setIsEditing(true);
  };

  const handleUpdateName = () => {
    if (!title.trim() || title === playlistInfo?.name) {
      setIsEditing(false);
      return;
    }
    updateNameMutation.mutate(title);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleUpdateName();
    else if (e.key === "Escape") setIsEditing(false);
  };

  // --- 렌더링 준비 ---
  const isLoading = isPlaylistLoading || (isMine && isTracksLoading);
  const isInitialLoading = status === "pending" && fetchStatus === "fetching";
  if (isLoading || isInitialLoading) {
    return (
      <div className={styles.loading}>
        <LoadingDots />
      </div>
    );
  }

  if (error || !playlistInfo) {
    return (
      <div className={styles.loading}>
        <ErrorUi error={error} />
      </div>
    );
  }

  const totalMs = tracks.reduce((acc, track) => acc + (track.durationMs || 0), 0);

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {!isRelaxMode && (
          <div className={styles.wrapper}>
            <div className={styles.overlay}></div>

            <header className={styles.hero}>
              <div className={styles.heroArtWrapper}>
                <Image
                  src={playlistInfo.image || playlistImgFromUrl || "/default_playlist.png"}
                  alt={playlistInfo.name}
                  fill
                  priority
                  sizes="24rem"
                  className={styles.heroArt}
                />
              </div>
              <div className={styles.heroText}>
                <span className={styles.label}>{isMine ? "MY PLAYLIST" : "PLAYLIST"}</span>
                <div className={styles.titleContainer}>
                  {isMine && isEditing ? (
                    <div className={styles.editForm}>
                      <input
                        className={styles.titleInput}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                        spellCheck={false}
                      />
                      <div className={styles.editBtnGroup}>
                        <button
                          onMouseDown={handleUpdateName}
                          className={styles.editActionBtn}
                        >
                          <FaCheck />
                        </button>
                        <button
                          onMouseDown={() => setIsEditing(false)}
                          className={`${styles.editActionBtn} ${styles.cancel}`}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <h2 className={styles.titleWrapper}>
                      <span className={styles.titleText}>{playlistInfo.name}</span>
                      {isMine && (
                        <FaRegEdit
                          className={styles.editIcon}
                          onClick={handleEditStart}
                        />
                      )}
                    </h2>
                  )}
                </div>
                <div className={styles.metaRow}>
                  {!isMine && <span>By {playlistInfo.owner}</span>}
                  {!isMine && <span className={styles.dot}>•</span>}
                  <span>{tracks.length} tracks</span>
                  <span className={styles.dot}>•</span>
                  <span>{formatTotalDuration(totalMs)}</span>
                </div>
                <button
                  className={styles.playBtn}
                  onClick={() => playAllTracks(tracks, 0)}
                >
                  <FaPlay size={12} /> Play All
                </button>
              </div>
            </header>

            {isMine ? (
              <MyPlaylistList
                playlistId={playlistId}
                initialTracks={tracks}
              />
            ) : (
              <div style={{ marginTop: "4rem" }}>
                <TrackList tracks={tracks} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
