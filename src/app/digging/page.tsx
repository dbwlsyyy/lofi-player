"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  searchSpotify,
  addTrackToPlaylist,
  type SearchResult,
  type SearchFilter,
} from "@/apis/userApi";
import { usePlayControl } from "@/hooks/usePlayControl";
import { useUIStore } from "@/store/uiStore";
import toast from "react-hot-toast";

import styles from "./Digging.module.css";
import NavBar from "../home/components/NavToggle/NavToggle";
import AddToPlaylistModal from "./components/AddToPlaylistModal/AddToPlaylistModal";

// 분리한 컴포넌트 임포트
import SearchBar from "./components/SearchBar";
import FilterBar from "./components/FilterBar";
import TrackList from "./components/TrackList";
import ArtistGrid from "./components/ArtistGrid";
import AlbumGrid from "./components/AlbumGrid";
import PlaylistList from "./components/PlaylistList";

export default function DiggingPage() {
  const { data: session } = useSession();
  const { isRelaxMode } = useUIStore();
  const { playFromPlaylist } = usePlayControl();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("track"); // 기본값 '곡'
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTrackUri, setTargetTrackUri] = useState("");

  // 검색 로직
  useEffect(() => {
    const token = session?.accessToken;
    if (!query.trim() || !token) {
      setResults([]); // 검색어 없을 때만 비움
      return;
    }

    // isLoading만 true로 하고 results는 유지 (이전 결과 보여주다가 교체)
    // 2. 검색 시작 시 이전 결과 즉시 삭제 & 로딩 시작 (화면 깜빡임 해결)
    setResults([]);
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await searchSpotify(token, query, filter);
        setResults(data); // 데이터 도착 시 교체
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 디바운스 0.5초

    return () => clearTimeout(timer);
  }, [query, filter, session?.accessToken]);

  // 핸들러들
  const handlePlayNow = (item: SearchResult) => {
    if (!session?.accessToken) return;
    const trackToPlay = {
      id: item.id,
      name: item.name,
      artists: item.artists || [],
      image: item.image,
      uri: item.uri,
      durationMs: item.durationMs || 0,
    };
    playFromPlaylist([trackToPlay], 0, session.accessToken);
    toast.success(
      <div className="toast-content">
        <div className="toast-message">바로 재생</div>
        <div className="toast-divider" />
        <span style={{ opacity: 0.6 }}>{item.name}</span>
      </div>,
      { className: "minimal-toast", icon: null },
    );
  };

  const handleAddClick = (uri: string) => {
    setTargetTrackUri(uri);
    setIsModalOpen(true);
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!session?.accessToken) return;
    try {
      await addTrackToPlaylist(session.accessToken, playlistId, targetTrackUri);
      setIsModalOpen(false);
      toast.success("플리에 추가완료!", {
        className: "minimal-toast",
        icon: null,
      });
    } catch (error) {
      toast.error("추가 실패");
    }
  };

  const handlePending = (msg: string) => {
    toast(msg + " 준비중", { className: "minimal-toast", icon: null });
  };

  return (
    <main className={styles.container}>
      {!isRelaxMode && (
        <div className={styles.contentWrapper}>
          {/* 1. 검색창 컴포넌트 */}
          <SearchBar
            query={query}
            setQuery={setQuery}
            placeholder={`${filter === "track" ? "곡" : filter === "artist" ? "아티스트" : filter === "album" ? "앨범" : "플레이리스트"} 검색...`}
          />

          {/* 2. 필터바 컴포넌트 */}
          <FilterBar filter={filter} setFilter={setFilter} />

          {/* 3. 결과 렌더링 (조건부) */}
          <div className={styles.resultSection}>
            {isLoading ? (
              /* 로딩 중일 때 확실하게 메시지 표시 */
              <p className={styles.statusMsg}>디깅 중...</p>
            ) : results.length > 0 ? (
              /* 로딩 끝나고 데이터 있을 때만 렌더링 */
              <>
                {filter === "track" && (
                  <TrackList
                    tracks={results}
                    onPlay={handlePlayNow}
                    onAdd={handleAddClick}
                  />
                )}
                {filter === "artist" && (
                  <ArtistGrid
                    artists={results}
                    onClick={() => handlePending("아티스트 페이지")}
                  />
                )}
                {filter === "album" && (
                  <AlbumGrid
                    albums={results}
                    onClick={() => handlePending("앨범 상세")}
                  />
                )}
                {filter === "playlist" && (
                  <PlaylistList
                    playlists={results}
                    onClick={() => handlePending("플레이리스트")}
                  />
                )}
              </>
            ) : (
              query && (
                /* 검색어는 있는데 결과가 없을 때 */
                <p className={styles.statusMsg}>검색 결과가 없습니다.</p>
              )
            )}
          </div>
        </div>
      )}

      <NavBar />
      <AddToPlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectPlaylist}
        accessToken={session?.accessToken || ""}
      />
    </main>
  );
}
