"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { addTrackToPlaylist, searchTracks } from "@/apis/spotifyUserApi";
import styles from "./Digging.module.css";
import NavBar from "../home/components/NavBar/NavBar"; // 경로 확인 필요
import { FiCheckCircle, FiPlay, FiSearch } from "react-icons/fi";
import Image from "next/image";
import { Track, usePlayerStore } from "@/store/usePlayerStore";
import { useUIStore } from "@/store/useUIStore";
import AddModal from "./components/AddModal";
import toast from "react-hot-toast";
import { usePlayControl } from "@/hooks/usePlayControl";

export default function DiggingPage() {
  const { data: session } = useSession();
  const { isRelaxMode } = useUIStore();
  const { playFromPlaylist } = usePlayControl();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTrackUri, setTargetTrackUri] = useState("");

  useEffect(() => {
    if (!query.trim() || !session?.accessToken) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchTracks(session.accessToken!, query);
        setResults(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, session?.accessToken]);

  const handlePlayNow = (track: Track) => {
    if (!session?.accessToken) return;

    // playFromPlaylist(재생할 곡 배열, 시작 인덱스, 토큰)
    // 검색 결과 리스트 전체를 넘기면 다음 곡으로 넘기기도 가능해집니다.
    playFromPlaylist([track], 0, session.accessToken);
  };

  const handleAddClick = (uri: string) => {
    setTargetTrackUri(uri);
    setIsModalOpen(true);
  };

  const handleSelect = async (playlistId: string) => {
    try {
      await addTrackToPlaylist(session?.accessToken!, playlistId, targetTrackUri);
      setIsModalOpen(false);
      toast(
        <div className="toast-content">
          <div className="toast-message">
            <FiCheckCircle
              size="1.6rem"
              color="#3b82f6"
            />
            <span>디깅 완료!</span>
          </div>
        </div>,
        {
          className: "minimal-toast",
          duration: 3000,
        },
      );
    } catch (error) {
      toast.error("추가 실패. 다시 시도해주세요.");
    }
  };

  return (
    <main className={styles.container}>
      {!isRelaxMode && (
        <div className={styles.contentWrapper}>
          {/* 검색창 캡슐 */}
          <div className={styles.searchHeader}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="음악, 아티스트 검색..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* 검색 결과 영역 */}
          <div className={styles.resultSection}>
            {isLoading ? (
              <p className={styles.statusMsg}>음악을 찾는 중...</p>
            ) : results.length > 0 ? (
              <div className={styles.trackGrid}>
                {results.map((track: Track) => (
                  <div
                    key={track.id}
                    className={styles.trackCard}
                  >
                    <div className={styles.imageWrapper}>
                      <Image
                        src={track.image || "/default_album.png"}
                        alt={track.name}
                        fill
                      />
                      <button
                        className={styles.playBtn}
                        title="바로 재생"
                        onClick={() => handlePlayNow(track)}
                      >
                        <FiPlay
                          className={styles.playIcon}
                          size="1.6rem"
                        />
                      </button>
                      <button
                        className={styles.addBtn}
                        title="플리에 추가"
                        onClick={() => handleAddClick(track.uri)}
                      >
                        +
                      </button>
                    </div>
                    <div className={styles.trackInfo}>
                      <h4>{track.name}</h4>
                      <p>{track.artists.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : query && !isLoading ? (
              <p className={styles.statusMsg}>검색 결과가 없습니다.</p>
            ) : (
              <div className={styles.emptyState}>
                <p>새로운 음악을 디깅해보세요.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <NavBar />
      <AddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        accessToken={session?.accessToken || ""}
      />
    </main>
  );
}
