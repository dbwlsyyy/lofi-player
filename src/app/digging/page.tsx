"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { searchSpotify } from "@/apis/diggingApi";
import { useUiStore } from "@/store/useUiStore";
import { Album, Artist, Playlist, SearchFilter, Track } from "@/types/domainTypes";
import styles from "./Digging.module.css";
import NavBar from "../../components/common/NavToggle/NavToggle";

import SearchBar from "./components/SearchBar/SearchBar";
import FilterBar from "./components/FilterBar/FilterBar";
import TrackList from "./components/TrackList/TrackList";
import ArtistGrid from "./components/ArtistGrid/ArtistGrid";
import AlbumGrid from "./components/AlbumGrid/AlbumGrid";
import PlaylistList from "./components/PlaylistList/PlaylistList";

import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

export default function DiggingPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { isRelaxMode } = useUiStore();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("track"); // 기본값 '곡'

  const debouncedSearchTerm = useDebounce(query, 500);

  // 💡 2. 스크롤 바닥 감지 센서 (ref를 박아둔 곳이 화면에 보이면 inView가 true가 됨)
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["search", debouncedSearchTerm, filter],
    queryFn: ({ pageParam, signal }) =>
      searchSpotify(accessToken!, debouncedSearchTerm, filter, pageParam as number, signal),

    initialPageParam: 0,

    getNextPageParam: (lastPage, allPages) => {
      // 배열로 반환된 lastPage의 길이가 30개라면 다음 페이지가 있다고 판단
      return lastPage.length === 30 ? allPages.length * 30 : undefined;
    },
    enabled: !!debouncedSearchTerm && !!accessToken,
  });

  // 💡 4. 센서가 화면에 보이고, 다음 페이지가 있으면 fetchNextPage 함수 실행!
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // 💡 5. 페이지별로 나뉜 배열( [[1~30], [31~60]] )을 하나의 배열로 납작하게(flat) 펴주기
  const results = data?.pages.flat() || [];

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
                {filter === "track" && <TrackList tracks={results as Track[]} />}
                {filter === "artist" && <ArtistGrid artists={results as Artist[]} />}
                {filter === "album" && <AlbumGrid albums={results as Album[]} />}
                {filter === "playlist" && <PlaylistList playlists={results as Playlist[]} />}

                {/* 💡 6. 바닥 감지용 투명 센서 장착! */}
                <div
                  ref={ref}
                  style={{ height: "40px", width: "100%" }}
                >
                  {isFetchingNextPage && <p className={styles.statusMsg}>더 불러오는 중...</p>}
                </div>
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
    </main>
  );
}
