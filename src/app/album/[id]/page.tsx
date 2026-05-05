"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./AlbumDetail.module.css";
import { fetchAlbum } from "@/apis/userApi";
import { useUiStore } from "@/store/useUiStore";
import { FaPlay } from "react-icons/fa";
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

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {!isRelaxMode && (
          <>
            <header className={styles.hero}>
              <div className={styles.artContainer}>
                <div className={styles.albumArtWrapper}>
                  <Image
                    src={album.image}
                    alt={album.name}
                    fill
                    priority
                    sizes="28rem"
                    className={styles.art}
                  />
                </div>
                <div className={styles.vinyl}></div>
              </div>

              <div className={styles.heroText}>
                <span className={styles.label}>{album.type}</span>
                <h1 className={styles.title}>{album.name}</h1>
                <div className={styles.metaRow}>
                  <span className={styles.artistLink}>{album.artists?.join(", ")}</span>
                  <span className={styles.dot}>•</span>
                  <span>{album.releaseDate.split("-")[0]}</span>
                  <span className={styles.dot}>•</span>
                  <span>{album.tracks.length} songs</span>
                </div>
                <div className={styles.actionRow}>
                  <button
                    className={styles.playBtn}
                    onClick={() => playAllTracks(album.tracks, 0)}
                  >
                    <FaPlay size={16} /> Play Album
                  </button>
                </div>
              </div>
            </header>

            <section className={styles.section}>
              <TrackList tracks={searchResultTracks} />
            </section>

            <footer className={styles.footer}>
              <p className={styles.labelName}>{album.label}</p>
              {album.copyrights.map((c, i) => (
                <p key={i} className={styles.copyright}>{c.text}</p>
              ))}
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
