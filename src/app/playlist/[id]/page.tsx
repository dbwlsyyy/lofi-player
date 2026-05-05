"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, KeyboardEvent } from "react";
import styles from "./PlaylistDetail.module.css";
import { fetchPlaylistTracks, updatePlaylistName, fetchMe } from "@/apis/userApi";
import { fetchPlaylist } from "@/apis/diggingApi";
import { useUiStore } from "@/store/useUiStore";
import { FaPlay, FaRegEdit, FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import LoadingDots from "@/components/loading/LoadingDots/LoadingDots";
import { formatTotalDuration } from "@/lib/formatTime";
import { Track, Playlist } from "@/types/domainTypes";
import { uiToast } from "@/lib/toasts";
import Image from "next/image";
import axios from "axios";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useShallow } from "zustand/shallow";
import MyPlaylistList from "../components/MyPlaylistList/MyPlaylistList";
import TrackList from "@/app/digging/components/TrackList/TrackList";

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isRelaxMode } = useUiStore();
  const { token, playAllTracks } = usePlayerStore(
    useShallow((state) => ({
      token: state.accessToken,
      playAllTracks: state.playAllTracks,
    })),
  );

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlistInfo, setPlaylistInfo] = useState<Playlist | null>(null);
  const [isMine, setIsMine] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const playlistImgFromUrl = searchParams.get("img");

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!token || !id) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [me, playlist] = await Promise.all([
          fetchMe(token, controller.signal),
          fetchPlaylist(token, id as string, controller.signal),
        ]);

        const mine = playlist.ownerId === me.id;
        setIsMine(mine);
        setPlaylistInfo(playlist);
        setTitle(playlist.name);

        if (mine) {
          const lists = await fetchPlaylistTracks(token, id as string, controller.signal);
          setTracks(lists);
        } else {
          setTracks(playlist.tracks || []);
        }
        setLoading(false);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("데이터 로드 실패:", err);
        setError("플레이리스트 정보를 불러오지 못했습니다.");
        uiToast.error("정보를 불러오지 못했습니다.");
        setLoading(false);
      }
    };

    loadData();

    return () => controller.abort();
  }, [id, token]);

  const handleUpdateName = async () => {
    if (!title.trim() || title === playlistInfo?.name) {
      setTitle(playlistInfo?.name || "");
      setIsEditing(false);
      return;
    }

    const previousTitle = title;
    try {
      setIsEditing(false);
      await updatePlaylistName(token!, id as string, title);
      uiToast.success("플레이리스트 이름이 변경되었습니다.");

      if (playlistInfo) {
        setPlaylistInfo({ ...playlistInfo, name: title });
      }

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("name", title);
      router.replace(`/playlist/${id}?${newParams.toString()}`, { scroll: false });
    } catch (err: unknown) {
      setTitle(previousTitle);
      uiToast.error("이름 수정 중 오류가 발생했습니다.");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleUpdateName();
    else if (e.key === "Escape") {
      setTitle(playlistInfo?.name || "");
      setIsEditing(false);
    }
  };

  if (loading)
    return (
      <div className={styles.loading}>
        <LoadingDots />
      </div>
    );
  if (error || !playlistInfo) {
    return (
      <div className={styles.loading}>
        <div style={{ textAlign: "center", color: "#a7b3d1" }}>
          <FaExclamationTriangle
            size={40}
            style={{ marginBottom: "1.5rem", color: "#4f7df3" }}
          />
          <p style={{ fontSize: "1.6rem" }}>{error || "정보를 표시할 수 없습니다."}</p>
        </div>
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
                          onMouseDown={() => {
                            setTitle(playlistInfo.name);
                            setIsEditing(false);
                          }}
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
                          onClick={() => setIsEditing(true)}
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
                playlistId={id as string}
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
