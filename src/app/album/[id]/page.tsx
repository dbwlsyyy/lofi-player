"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./AlbumDetail.module.css";
import { fetchAlbum } from "@/apis/userApi";
import { useUiStore } from "@/store/useUiStore";
import { FaPlay, FaInfoCircle, FaMusic } from "react-icons/fa";
import LoadingDots from "@/components/loading/LoadingDots/LoadingDots";
import { SpotifyAlbumDetailed } from "@/types/spotify";
import { mapTrackToSearchResult } from "@/lib/spotifyMapper";
import TrackList from "@/app/digging/components/TrackList/TrackList";
import { uiToast } from "@/lib/toasts";
import Image from "next/image";
import axios from "axios";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useShallow } from "zustand/shallow";

export default function AlbumDetailPage() {
  const { id } = useParams();
  const { isRelaxMode } = useUiStore();
  const { token, playAllTracks } = usePlayerStore(
    useShallow((state) => ({
      token: state.accessToken,
      playAllTracks: state.playAllTracks,
    })),
  );

  const [album, setAlbum] = useState<SpotifyAlbumDetailed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;

    const controller = new AbortController();
    setLoading(true);

    const loadAlbumData = async () => {
      try {
        const data = await fetchAlbum(token, id as string, controller.signal);
        setAlbum(data);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("앨범 데이터 로드 실패:", err);
        uiToast.error("앨범 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadAlbumData();

    return () => controller.abort();
  }, [id, token]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <LoadingDots />
      </div>
    );
  }

  if (!album) return null;

  const searchResultTracks = album.tracks.map(mapTrackToSearchResult);
  const totalDurationMin = Math.floor(
    album.tracks.reduce((acc, t) => acc + t.durationMs, 0) / 60000,
  );

  return (
    <main className={`${styles.container} ${isRelaxMode ? styles.relaxModeBg : ""}`}>
      <div className={styles.content}>
        {!isRelaxMode && (
          <>
            <header className={styles.hero}>
              <div className={styles.artSection}>
                <div className={styles.artWrapper}>
                  <Image
                    src={album.image}
                    alt={album.name}
                    fill
                    priority
                    sizes="34rem"
                    className={styles.art}
                  />
                </div>
                <div className={styles.vinyl}>
                  <div className={styles.vinylLabel}>
                    <Image
                      src={album.image}
                      alt=""
                      fill
                      sizes="12rem"
                      className={styles.art}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.heroText}>
                <span className={styles.label}>{album.type} Collection</span>
                <h1 className={styles.title}>{album.name}</h1>
                <div className={styles.metaRow}>
                  <span className={styles.artistLink}>{album.artists?.join(", ")}</span>
                  <div className={styles.dot} />
                  <span>{album.releaseDate.split("-")[0]}</span>
                  <div className={styles.dot} />
                  <span>{album.tracks.length} Tracks</span>
                </div>
                <div className={styles.actionRow}>
                  <button
                    className={styles.playBtn}
                    onClick={() => playAllTracks(album.tracks, 0)}
                  >
                    <FaPlay size={18} /> Play Album
                  </button>
                </div>
              </div>
            </header>
            <div className={styles.detailsGrid}>
              <section className={styles.tracksSection}>
                <h2 className={styles.sectionTitle}>
                  <FaMusic size={20} /> Tracklist
                </h2>
                <TrackList tracks={searchResultTracks} />
              </section>

              <aside className={styles.infoSection}>
                <h2 className={styles.sectionTitle}>
                  <FaInfoCircle size={20} /> Album Info
                </h2>
                <div className={styles.infoCard}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Released (발매일)</span>
                    <p className={styles.infoValue}>{album.releaseDate}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Label (레이블)</span>
                    <p className={styles.infoValue}>{album.label}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Total Duration (전체 재생 시간)</span>
                    <p className={styles.infoValue}>{totalDurationMin} 분</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Format (발매 형식)</span>
                    <p className={styles.infoValue}>{album.type.toUpperCase()}</p>
                  </div>
                </div>
              </aside>
            </div>{" "}
          </>
        )}
      </div>
    </main>
  );
}
