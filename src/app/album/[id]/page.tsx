"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./AlbumDetail.module.css";
import { fetchAlbum } from "@/apis/userApi";
import { useUiStore } from "@/store/useUiStore";
import { FaPlay, FaInfoCircle, FaMusic, FaExclamationTriangle } from "react-icons/fa";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const loadAlbumData = async () => {
      try {
        const data = await fetchAlbum(token, id as string, controller.signal);
        if (!data) {
          throw new Error("앨범 데이터를 찾을 수 없습니다.");
        }
        setAlbum(data);
        setLoading(false);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("앨범 데이터 로드 실패:", err);
        const message = "앨범 정보를 불러오는 중 오류가 발생했습니다.";
        setError(message);
        uiToast.error(message);
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

  if (error || !album) {
    return (
      <div className={styles.loading}>
        <div style={{ textAlign: "center", color: "#a7b3d1" }}>
          <FaExclamationTriangle
            size={40}
            style={{ marginBottom: "1.5rem", color: "#4f7df3" }}
          />
          <p style={{ fontSize: "1.6rem" }}>{error || "앨범 정보를 표시할 수 없습니다."}</p>
        </div>
      </div>
    );
  }

  const artistsName = Array.isArray(album.artists)
    ? album.artists.join(", ")
    : "알 수 없는 아티스트";
  const releaseYear =
    album.releaseDate && typeof album.releaseDate === "string"
      ? album.releaseDate.split("-")[0]
      : "정보 없음";

  const tracks = Array.isArray(album.tracks) ? album.tracks : [];
  const searchResultTracks = tracks.map(mapTrackToSearchResult);
  const totalDurationMin = Math.floor(
    tracks.reduce((acc, t) => acc + (t.durationMs || 0), 0) / 60000,
  );

  return (
    <main className={`${styles.container} ${isRelaxMode ? styles.relaxModeBg : ""}`}>
      <div className={styles.content}>
        {!isRelaxMode && (
          <div className={styles.fadeContent}>
            <header className={styles.hero}>
              <div className={styles.artSection}>
                <div className={styles.artWrapper}>
                  <Image
                    src={album.image || "/default_album.png"}
                    alt={album.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 26rem, 34rem"
                    className={styles.art}
                  />
                </div>
                <div className={styles.vinyl}>
                  <div className={styles.vinylLabel}>
                    <Image
                      src={album.image || "/default_album.png"}
                      alt={album.name}
                      fill
                      sizes="(max-width: 768px) 10rem, 12rem"
                      className={styles.art}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.heroText}>
                <span className={styles.label}>{album.type || "Album"} Collection</span>
                <h1 className={styles.title}>{album.name || "정보 없음"}</h1>
                <div className={styles.metaRow}>
                  <span className={styles.artistLink}>{artistsName}</span>
                  <div className={styles.dot} />
                  <span>{releaseYear}</span>
                  <div className={styles.dot} />
                  <span>{tracks.length} Tracks</span>
                </div>
                <div className={styles.actionRow}>
                  <button
                    className={styles.playBtn}
                    onClick={() => tracks.length > 0 && playAllTracks(tracks, 0)}
                    disabled={tracks.length === 0}
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
                {tracks.length > 0 ? (
                  <TrackList tracks={searchResultTracks} />
                ) : (
                  <p style={{ color: "#a7b3d1", fontSize: "1.4rem", padding: "2rem 0" }}>
                    수록곡 정보가 없습니다.
                  </p>
                )}
              </section>

              <aside className={styles.infoSection}>
                <h2 className={styles.sectionTitle}>
                  <FaInfoCircle size={20} /> Album Info
                </h2>
                <div className={styles.infoCard}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Released (발매일)</span>
                    <p className={styles.infoValue}>{album.releaseDate || "정보 없음"}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Label (레이블)</span>
                    <p className={styles.infoValue}>{album.label || "정보 없음"}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Total Duration (총 재생 시간)</span>
                    <p className={styles.infoValue}>{totalDurationMin} 분</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Format (발매 형식)</span>
                    <p className={styles.infoValue}>{(album.type || "Album").toUpperCase()}</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
