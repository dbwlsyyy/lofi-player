"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import styles from "./ArtistDetail.module.css";
import { fetchArtist, fetchArtistTopTracks, fetchArtistAlbums } from "@/apis/userApi";
import { useSession } from "next-auth/react";
import { useUiStore } from "@/store/useUiStore";
import { FaPlay, FaMicrophone } from "react-icons/fa";
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

  const [data, setData] = useState<{
    artist: any;
    topTracks: Track[];
    albums: any[];
  }>({
    artist: null,
    topTracks: [],
    albums: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;

    const controller = new AbortController();
    setLoading(true);

    const loadAllData = async () => {
      try {
        const [artistData, tracksData, albumsData] = await Promise.all([
          fetchArtist(token, id as string, controller.signal),
          fetchArtistTopTracks(token, id as string, "KR", controller.signal),
          fetchArtistAlbums(token, id as string, 12, controller.signal),
        ]);

        setData({
          artist: artistData,
          topTracks: tracksData.map(t => ({ ...t, uniqueKey: crypto.randomUUID() })),
          albums: albumsData,
        });
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("데이터 로드 실패:", err);
        uiToast.error("정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();

    return () => controller.abort();
  }, [id, token]);

  // 최적화: 렌더링 시 계산 방지
  const followerCount = useMemo(() => 
    data.artist?.followers?.total.toLocaleString() || "0", 
    [data.artist]
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        <LoadingDots />
      </div>
    );
  }

  if (!data.artist) return null;

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {!isRelaxMode && (
          <>
            {/* 독창적인 히어로 섹션 */}
            <header className={styles.hero}>
              <div className={styles.heroBg}>
                <Image
                  src={data.artist.images?.[0]?.url || "/default_artist.png"}
                  alt=""
                  fill
                  className={styles.heroArt}
                  priority
                />
              </div>
              <div className={styles.heroContent}>
                <div className={styles.heroArtWrapper}>
                  <Image
                    src={data.artist.images?.[0]?.url || "/default_artist.png"}
                    alt={data.artist.name}
                    fill
                    priority
                    sizes="20rem"
                    className={styles.heroArt}
                  />
                </div>
                <div className={styles.heroText}>
                  <span className={styles.label}>
                    <FaMicrophone style={{ marginRight: '0.5rem' }} /> Verified Artist
                  </span>
                  <h1 className={styles.title}>{data.artist.name}</h1>
                  <div className={styles.metaRow}>
                    <span>{followerCount} followers</span>
                    <span className={styles.dot}>•</span>
                    <span>{data.artist.genres?.slice(0, 2).join(" / ")}</span>
                  </div>
                  <div className={styles.actionRow}>
                    <button
                      className={styles.playBtn}
                      onClick={() => playAllTracks(data.topTracks, 0)}
                    >
                      <FaPlay size={14} /> Play Popular
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* 인기 트랙 섹션 - 새로운 레이아웃 */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Popular Tracks</h2>
              <div className={styles.trackList}>
                {data.topTracks.slice(0, 6).map((t, i) => (
                  <div
                    key={t.uniqueKey}
                    className={styles.trackRow}
                    onClick={() => playSingleTrack(t)}
                  >
                    <div className={styles.trackArt}>
                      <Image
                        src={t.image || "/default_album.png"}
                        alt={t.name}
                        fill
                        sizes="4.5rem"
                        className={styles.art}
                      />
                    </div>
                    <div className={styles.trackInfo}>
                      <p className={styles.trackName}>{t.name}</p>
                      <p className={styles.trackMeta}>{formatTime(t.durationMs)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 앨범 섹션 추가 */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Discography</h2>
              <div className={styles.albumGrid}>
                {data.albums.map((album) => (
                  <div key={album.id} className={styles.albumCard}>
                    <div className={styles.albumArtWrapper}>
                      <Image
                        src={album.image}
                        alt={album.name}
                        fill
                        sizes="15rem"
                        className={styles.art}
                      />
                    </div>
                    <div className={styles.albumInfo}>
                      <p className={styles.albumName}>{album.name}</p>
                      <p className={styles.albumMeta}>
                        {album.releaseDate.split("-")[0]} • {album.type}
                      </p>
                    </div>
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
