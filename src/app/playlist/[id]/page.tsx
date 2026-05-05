"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./PlaylistDetail.module.css";
import { fetchPlaylist } from "@/apis/userApi";
import { useUiStore } from "@/store/useUiStore";
import { FaPlay, FaMusic, FaExclamationTriangle } from "react-icons/fa";
import LoadingDots from "@/components/loading/LoadingDots/LoadingDots";
import { SpotifyPlaylistDetailed } from "@/types/spotify";
import { mapTrackToSearchResult } from "@/lib/spotifyMapper";
import TrackList from "@/app/digging/components/TrackList/TrackList";
import { uiToast } from "@/lib/toasts";
import Image from "next/image";
import axios from "axios";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useShallow } from "zustand/shallow";

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const { isRelaxMode } = useUiStore();
  const { token, playAllTracks } = usePlayerStore(
    useShallow((state) => ({
      token: state.accessToken,
      playAllTracks: state.playAllTracks,
    })),
  );

  const [playlist, setPlaylist] = useState<SpotifyPlaylistDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const loadPlaylistData = async () => {
      try {
        const data = await fetchPlaylist(token, id as string, controller.signal);
        if (!data) {
          throw new Error("플레이리스트 데이터를 찾을 수 없습니다.");
        }
        setPlaylist(data);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("플레이리스트 데이터 로드 실패:", err);
        const message = "플레이리스트 정보를 불러오는 중 오류가 발생했습니다.";
        setError(message);
        uiToast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadPlaylistData();

    return () => controller.abort();
  }, [id, token]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <LoadingDots />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className={styles.loading}>
        <div style={{ textAlign: 'center', color: '#a7b3d1' }}>
          <FaExclamationTriangle size={40} style={{ marginBottom: '1.5rem', color: '#4f7df3' }} />
          <p style={{ fontSize: '1.6rem' }}>{error || "플레이리스트 정보를 표시할 수 없습니다."}</p>
        </div>
      </div>
    );
  }

  const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
  const searchResultTracks = tracks.map(mapTrackToSearchResult);

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div style={{ opacity: isRelaxMode ? 0.3 : 1, transition: 'opacity 0.5s ease' }}>
          {/* 미니멀 히어로 섹션 */}
          <header className={styles.hero}>
            <div className={styles.artWrapper}>
              <Image
                src={playlist.image || "/default_playlist.png"}
                alt={playlist.name}
                fill
                priority
                sizes="(max-width: 768px) 20rem, 24rem"
                className={styles.art}
              />
            </div>

            <div className={styles.heroText}>
              <h1 className={styles.title}>{playlist.name || "Untitled Playlist"}</h1>
              {playlist.description && (
                <p className={styles.description} dangerouslySetInnerHTML={{ __html: playlist.description }} />
              )}
              <div className={styles.metaRow}>
                <span>By {playlist.owner}</span>
                <div className={styles.dot} />
                <span>{playlist.tracksTotal} Tracks</span>
                <div className={styles.dot} />
                <span>{playlist.followers.toLocaleString()} Followers</span>
              </div>
              <div className={styles.actionRow}>
                <button
                  className={styles.playBtn}
                  onClick={() => tracks.length > 0 && playAllTracks(tracks, 0)}
                  disabled={tracks.length === 0}
                >
                  <FaPlay size={14} style={{ marginRight: '0.8rem' }} /> Play All
                </button>
              </div>
            </div>
          </header>

          <section className={styles.tracksSection}>
            <h2 className={styles.sectionTitle}>
              <FaMusic size={16} /> Tracks
            </h2>
            {tracks.length > 0 ? (
              <TrackList tracks={searchResultTracks} />
            ) : (
              <p style={{ color: '#a7b3d1', fontSize: '1.4rem', textAlign: 'center', padding: '4rem 0' }}>
                플레이리스트가 비어 있습니다.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
