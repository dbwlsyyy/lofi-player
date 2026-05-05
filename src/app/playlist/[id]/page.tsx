"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, KeyboardEvent } from "react";
import styles from "./PlaylistDetail.module.css";
import { 
  fetchPlaylistTracks, 
  removeTrackFromPlaylist, 
  updatePlaylistName,
  fetchPlaylist,
  fetchMe
} from "@/apis/userApi";
import { useSession } from "next-auth/react";
import { useUiStore } from "@/store/useUiStore";
import { FaPlay, FaRegEdit, FaCheck, FaTimes, FaMusic, FaExclamationTriangle } from "react-icons/fa";
import LoadingDots from "@/components/loading/LoadingDots/LoadingDots";
import { formatTotalDuration } from "@/lib/formatTime";
import ConfirmModal from "@/components/modal/ConfirmModal/ConfirmModal";
import { Track } from "@/types/player";
import { uiToast } from "@/lib/toasts";
import Image from "next/image";
import axios from "axios";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useShallow } from "zustand/shallow";
import MyPlaylistList from "../components/MyPlaylistList/MyPlaylistList";
import TrackList from "@/app/digging/components/TrackList/TrackList";
import { mapTrackToSearchResult } from "@/lib/spotifyMapper";
import { SpotifyPlaylistDetailed } from "@/types/spotify";

export default function PlaylistDetailPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isRelaxMode } = useUiStore();
  const { playAllTracks, playSingleTrack } = usePlayerStore(
    useShallow((state) => ({
      playAllTracks: state.playAllTracks,
      playSingleTrack: state.playSingleTrack,
    })),
  );

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlistInfo, setPlaylistInfo] = useState<SpotifyPlaylistDetailed | null>(null);
  const [isMine, setIsMine] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const playlistNameFromUrl = searchParams.get("name");
  const playlistImgFromUrl = searchParams.get("img");

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrackUri, setSelectedTrackUri] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        // 1. 내 정보와 플레이리스트 정보를 병렬로 가져옴
        const [me, playlist] = await Promise.all([
          fetchMe(token, controller.signal),
          fetchPlaylist(token, id as string, controller.signal)
        ]);

        const mine = playlist.owner === me.display_name || playlist.owner === me.id;
        setIsMine(mine);
        setPlaylistInfo(playlist);
        setTitle(playlist.name);

        if (mine) {
          // 내 플레이리스트인 경우 기존 로직대로 트랙 목록 가져옴 (uniqueKey 추가)
          const lists = await fetchPlaylistTracks(token, id as string, controller.signal);
          setTracks(lists.map(t => ({ ...t, uniqueKey: crypto.randomUUID() })));
        } else {
          // 타 유저 플레이리스트인 경우 fetchPlaylist에서 가져온 트랙 사용
          setTracks(playlist.tracks);
        }
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("데이터 로드 실패:", err);
        setError("플레이리스트 정보를 불러오지 못했습니다.");
        uiToast.error("정보를 불러오지 못했습니다.");
      } finally {
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
    } catch (err: any) {
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

  const handleRemoveClick = (e: React.MouseEvent, trackUri: string) => {
    e.stopPropagation();
    setSelectedTrackUri(trackUri);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTrackUri) return;
    const previousTracks = [...tracks];
    setTracks(tracks.filter((t) => t.uri !== selectedTrackUri));
    setIsModalOpen(false);

    try {
      await removeTrackFromPlaylist(token!, id as string, selectedTrackUri);
      uiToast.success("곡이 삭제되었습니다.");
    } catch (err) {
      setTracks(previousTracks);
      uiToast.error("곡 삭제에 실패했습니다.");
    } finally {
      setSelectedTrackUri(null);
    }
  };

  if (loading) return <div className={styles.loading}><LoadingDots /></div>;
  if (error || !playlistInfo) {
    return (
      <div className={styles.loading}>
        <div style={{ textAlign: 'center', color: '#a7b3d1' }}>
          <FaExclamationTriangle size={40} style={{ marginBottom: '1.5rem', color: '#4f7df3' }} />
          <p style={{ fontSize: '1.6rem' }}>{error || "정보를 표시할 수 없습니다."}</p>
        </div>
      </div>
    );
  }

  const totalMs = tracks.reduce((acc, track) => acc + (track.durationMs || 0), 0);
  const searchResultTracks = tracks.map(mapTrackToSearchResult);

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div style={{ opacity: isRelaxMode ? 0.3 : 1, transition: 'opacity 0.5s ease' }}>
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
              <span className={styles.label}>{isMine ? "MY PLAYLIST" : "USER PLAYLIST"}</span>
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
                      <button onMouseDown={handleUpdateName} className={styles.editActionBtn}><FaCheck /></button>
                      <button onMouseDown={() => { setTitle(playlistInfo.name); setIsEditing(false); }} className={`${styles.editActionBtn} ${styles.cancel}`}><FaTimes /></button>
                    </div>
                  </div>
                ) : (
                  <h2 className={styles.titleWrapper}>
                    <span className={styles.titleText}>{playlistInfo.name}</span>
                    {isMine && <FaRegEdit className={styles.editIcon} onClick={() => setIsEditing(true)} />}
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
              <button className={styles.playBtn} onClick={() => playAllTracks(tracks, 0)}>
                <FaPlay size={12} /> Play All
              </button>
            </div>
          </header>

          {isMine ? (
            <MyPlaylistList 
              tracks={tracks} 
              onPlayTrack={playSingleTrack} 
              onRemoveClick={handleRemoveClick} 
            />
          ) : (
            <section className={styles.tracksSection} style={{ marginTop: '4rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.8 }}>
                <FaMusic size={16} /> Tracks
              </h2>
              <TrackList tracks={searchResultTracks} />
            </section>
          )}
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
    </main>
  );
}
