"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import styles from "./ArtistDetail.module.css";
import { fetchArtist, fetchArtistTopTracks, fetchArtistAlbums } from "@/apis/diggingApi";
import { useUiStore } from "@/store/useUiStore";
import { FaPlay } from "react-icons/fa";
import LoadingDots from "@/components/loading/LoadingDots/LoadingDots";
import Image from "next/image";
import Link from "next/link";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useShallow } from "zustand/shallow";
import TrackList from "@/app/digging/components/TrackList/TrackList";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import ErrorUi from "@/components/common/ErrorUi/ErrorUi";

export default function ArtistDetailPage() {
  const { id } = useParams();
  const artistId = id as string;
  const { isRelaxMode } = useUiStore();
  const { token, playAllTracks } = usePlayerStore(
    useShallow((state) => ({
      token: state.accessToken,
      playAllTracks: state.playAllTracks,
    })),
  );

  const { ref, inView } = useInView();

  // 아티스트 기본 정보 가져오기 (일반 Query)
  const {
    data: artist,
    isLoading: isArtistLoading,
    error: artistError,
  } = useQuery({
    queryKey: ["artist", artistId],
    queryFn: ({ signal }) => fetchArtist(token!, artistId, signal),
    enabled: !!token && !!artistId,
  });

  // 인기 곡 가져오기 (일반 Query - 무조건 최대 10곡)
  const {
    data: topTracks = [],
    isLoading: isTracksLoading,
    error: tracksError,
  } = useQuery({
    queryKey: ["artistTopTracks", artistId],
    queryFn: ({ signal }) => fetchArtistTopTracks(token!, artistId, "KR", signal),
    enabled: !!token && !!artistId,
  });

  // 앨범 가져오기 (무한 스크롤 Infinite Query)
  const {
    data: albumsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isAlbumsLoading,
    error: albumsError,
  } = useInfiniteQuery({
    queryKey: ["artistAlbums", artistId],
    queryFn: ({ pageParam, signal }) =>
      fetchArtistAlbums(token!, artistId, 20, pageParam as number, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // API에서 limit을 20으로 요청했으므로, 20개가 꽉 차서 오면 다음 페이지가 있다고 판단
      return lastPage.length === 20 ? allPages.length * 20 : undefined;
    },
    enabled: !!token && !!artistId,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const rawAlbums = albumsData?.pages.flat() || [];
  const seenAlbumIds = new Set();

  const albums = rawAlbums.filter((item) => {
    if (seenAlbumIds.has(item.id)) return false; // 이미 있으면 탈락
    seenAlbumIds.add(item.id); // 없으면 넣고 통과
    return true;
  });

  const isLoading =
    (isArtistLoading && !artist) ||
    (isTracksLoading && topTracks.length === 0) ||
    (isAlbumsLoading && albums.length === 0);
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <LoadingDots />
      </div>
    );
  }

  const error = artistError || tracksError || albumsError;
  if (error || !artist) {
    return (
      <div className={styles.loading}>
        <ErrorUi error={error} />
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {!isRelaxMode && (
          <div className={styles.fadeContent}>
            <header className={styles.hero}>
              <div className={styles.heroBg}>
                <Image
                  src={artist.image}
                  alt="아티스트 이미지"
                  fill
                  className={styles.heroArt}
                  priority
                />
              </div>
              <div className={styles.heroContent}>
                <div className={styles.heroArtWrapper}>
                  <Image
                    src={artist.image}
                    alt={artist.name}
                    fill
                    priority
                    sizes="20rem"
                    className={styles.heroArt}
                  />
                </div>
                <div className={styles.heroText}>
                  <h1 className={styles.title}>{artist.name}</h1>
                  <div className={styles.metaRow}>
                    <span>{artist.followers.toLocaleString()} followers</span>
                    <span className={styles.dot}>•</span>
                    <span>{artist.genres.slice(0, 2).join(" / ") || "장르 없음"}</span>
                  </div>
                  <div className={styles.actionRow}>
                    <button
                      className={styles.playBtn}
                      onClick={() => topTracks.length > 0 && playAllTracks(topTracks, 0)}
                      disabled={topTracks.length === 0}
                    >
                      <FaPlay size={14} /> Play Popular
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Top 10 Tracks</h2>
              {topTracks.length > 0 ? (
                <TrackList tracks={topTracks} />
              ) : (
                <p style={{ color: "#a7b3d1", fontSize: "1.4rem", padding: "2rem 0" }}>
                  수록곡 정보가 없습니다.
                </p>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Albums</h2>
              {albums.length > 0 ? (
                <>
                  <div className={styles.albumGrid}>
                    {albums.map((album) => (
                      <Link
                        href={`/album/${album.id}`}
                        key={album.id}
                        className={styles.albumCard}
                      >
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
                      </Link>
                    ))}
                  </div>
                  <div
                    ref={ref}
                    style={{ height: "40px", width: "100%", marginTop: "2rem" }}
                  >
                    {isFetchingNextPage && (
                      <div style={{ textAlign: "center", color: "#a7b3d1" }}>
                        앨범 더 불러오는 중...
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ color: "#a7b3d1", fontSize: "1.4rem", padding: "2rem 0" }}>
                  앨범 정보가 없습니다.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
