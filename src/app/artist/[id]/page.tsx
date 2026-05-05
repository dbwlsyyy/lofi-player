"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./ArtistDetail.module.css";
import { fetchArtist, fetchArtistTopTracks } from "@/apis/userApi";
import { useSession } from "next-auth/react";
import { useUiStore } from "@/store/useUiStore";
import { FaPlay } from "react-icons/fa";
import LoadingDots from "@/components/loading/LoadingDots/LoadingDots";
import { formatTime } from "@/lib/formatTime";
import { Track } from "@/types/player";
import { uiToast } from "@/lib/toasts";
import Image from "next/image";
import axios from "axios";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useShallow } from "zustand/shallow";

export default function ArtistDetailPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const { id } = useParams();

  const { isRelaxMode } = useUiStore();
  const { playAllTracks, playSingleTrack } = usePlayerStore(
    useShallow((state) => ({
      playAllTracks: state.playAllTracks,
      playSingleTrack: state.playSingleTrack,
    })),
  );

  const [artist, setArtist] = useState<any>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;

    const controller = new AbortController();
    setLoading(true);

    const loadData = async () => {
      try {
        const [artistData, tracksData] = await Promise.all([
          fetchArtist(token, id as string, controller.signal),
          fetchArtistTopTracks(token, id as string, "KR", controller.signal),
        ]);

        setArtist(artistData);
        setTopTracks(tracksData.map(t => ({ ...t, uniqueKey: crypto.randomUUID() })));
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("아티스트 정보 로드 실패:", err);
        uiToast.error("아티스트 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, [id, token]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <LoadingDots />
      </div>
    );
  }

  if (!artist) return null;

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {!isRelaxMode && (
          <>
            <header className={styles.hero}>
              <div className={styles.heroArtWrapper}>
                <Image
                  src={artist.images?.[0]?.url || "/default_artist.png"}
                  alt={artist.name}
                  fill
                  priority
                  sizes="24rem"
                  className={styles.heroArt}
                />
              </div>
              <div className={styles.heroText}>
                <span className={styles.label}>ARTIST</span>
                <h1 className={styles.title}>{artist.name}</h1>
                <div className={styles.metaRow}>
                  <span>{artist.followers?.total.toLocaleString()} followers</span>
                  <span className={styles.dot}>•</span>
                  <span>{artist.genres?.slice(0, 3).join(", ")}</span>
                </div>
                <button
                  className={styles.playBtn}
                  onClick={() => playAllTracks(topTracks, 0)}
                >
                  <FaPlay size={12} /> Play Top Tracks
                </button>
              </div>
            </header>

            <section className={styles.listSection}>
              <h2 className={styles.sectionTitle}>Popular</h2>
              <div className={styles.listHeader}>
                <span className={styles.hNum}>#</span>
                <span className={styles.hTitle}>TITLE</span>
                <span className={styles.hArtist}>ARTIST</span>
                <span className={styles.hTime}>TIME</span>
              </div>

              <div className={styles.list}>
                {topTracks.map((t, i) => (
                  <div
                    key={t.uniqueKey}
                    className={styles.row}
                    onClick={() => playSingleTrack(t)}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <span className={styles.number}>{i + 1}</span>
                    <div className={styles.trackMain}>
                      <div className={styles.artWrapper}>
                        <Image
                          src={t.image || "/default_album.png"}
                          alt={t.name}
                          fill
                          sizes="3rem"
                          className={styles.art}
                        />
                      </div>
                      <p className={styles.name}>{t.name}</p>
                    </div>
                    <span className={styles.artist}>{t.artists.join(", ")}</span>
                    <span className={styles.time}>{formatTime(t.durationMs)}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
