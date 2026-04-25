"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { searchSpotify, addTrackToPlaylist } from "@/apis/userApi";
import { useUiStore } from "@/store/useUiStore";
import { SearchFilter, SearchResult } from "@/types/api";
import { uiToast } from "@/lib/toasts";
import styles from "./Digging.module.css";
import NavBar from "../../components/common/NavToggle/NavToggle";

import SearchBar from "./components/SearchBar/SearchBar";
import FilterBar from "./components/FilterBar/FilterBar";
import TrackList from "./components/TrackList/TrackList";
import ArtistGrid from "./components/ArtistGrid/ArtistGrid";
import AlbumGrid from "./components/AlbumGrid/AlbumGrid";
import PlaylistList from "./components/PlaylistList/PlaylistList";
import AddToPlaylistModal from "@/components/modal/AddToPlaylistModal/AddToPlaylistModal";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import { usePlayerStore } from "@/store/usePlayerStore";

export default function DiggingPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { isRelaxMode } = useUiStore();
  const playFromPlaylist = usePlayerStore((state) => state.playFromPlaylist);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("track"); // 기본값 '곡'
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTrackUri, setTargetTrackUri] = useState("");

  const debouncedSearchTerm = useDebounce(query, 500);

  // 검색 로직
  useEffect(() => {
    if (!debouncedSearchTerm.trim() || !accessToken) {
      // setResults([]); 기획 문제
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    const fetchSearchResults = async () => {
      try {
        const data = await searchSpotify(
          accessToken,
          debouncedSearchTerm,
          filter,
          controller.signal,
        );
        setResults(data);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();

    return () => {
      controller.abort();
    };
  }, [debouncedSearchTerm, filter, accessToken]);

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
    uiToast.custom("준비 중인 기능", null);
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
      uiToast.success("내 플리에 추가 완료!");
    } catch (error) {
      uiToast.error("곡 추가 실패!");
    }
  };

  const handlePending = (msg: string) => {
    uiToast.custom("준비 중인 기능", null);
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
          <FilterBar
            filter={filter}
            setFilter={setFilter}
          />

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
