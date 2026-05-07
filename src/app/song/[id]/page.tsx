"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLyricsStore } from "@/store/useLyricsStore";
import styles from "./SongDetail.module.css";
import lyricsStyles from "./LyricsView.module.css";
import {
  FaChevronDown,
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaRandom,
  FaRetweet,
} from "react-icons/fa";
import { formatTime } from "@/lib/formatTime";
import { useShallow } from "zustand/shallow";
import LoadingDots from "@/components/common/LoadingDots/LoadingDots";

const DetailProgressBar = () => {
  const position = usePlayerStore((state) => state.position);
  const duration = usePlayerStore((state) => state.duration);
  const seekTo = usePlayerStore((state) => state.seekTo);

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPosition = Math.floor((clickX / rect.width) * duration);
    seekTo(newPosition);
  };

  return (
    <div className={styles.progressSection}>
      <div className={styles.progressBar} onClick={handleSeek}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className={styles.progressHandle}
          style={{ left: `${progressPercent}%` }}
        />
      </div>
      <div className={styles.timeRow}>
        <span>{formatTime(position)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default function SongDetailPage() {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true); // 기본적으로 가사 뷰 활성화
  
  const {
    currentTrack,
    isPlaying,
    position,
    togglePlay,
    nextTrack,
    prevTrack,
    isShuffled,
    repeatMode,
    toggleShuffle,
    cycleRepeatMode,
  } = usePlayerStore(
    useShallow((state) => ({
      currentTrack: state.currentTrack,
      isPlaying: state.isPlaying,
      position: state.position,
      togglePlay: state.togglePlay,
      nextTrack: state.nextTrack,
      prevTrack: state.prevTrack,
      isShuffled: state.isShuffled,
      repeatMode: state.repeatMode,
      toggleShuffle: state.toggleShuffle,
      cycleRepeatMode: state.cycleRepeatMode,
    })),
  );

  const { lyrics, isLoading, error, getLyrics, clearLyrics } = useLyricsStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // 1. 가사 데이터 로드
  useEffect(() => {
    if (currentTrack) {
      getLyrics(
        currentTrack.name,
        currentTrack.artists[0],
        "",
        currentTrack.durationMs
      );
    }
    return () => clearLyrics();
  }, [currentTrack, getLyrics, clearLyrics]);

  // 2. 현재 시간에 맞는 가사 인덱스 계산
  const activeIndex = useMemo(() => {
    if (!lyrics || lyrics.lines.length === 0) return -1;
    const index = lyrics.lines.findIndex((line, i) => {
      const nextLine = lyrics.lines[i + 1];
      return position >= line.time && (!nextLine || position < nextLine.time);
    });
    return index;
  }, [lyrics, position]);

  // 3. 활성화된 가사로 자동 스크롤
  useEffect(() => {
    if (activeLineRef.current && scrollRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex]);

  if (!currentTrack) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      router.back();
    }, 300);
  };

  return (
    <main className={`${styles.container} ${isClosing ? styles.closing : ""}`}>
      <div
        className={styles.dynamicBg}
        style={{ backgroundImage: `url(${currentTrack.image})` }}
      />
      <div className={styles.overlay} />

      <div className={styles.content}>
        <header className={styles.header}>
          <button className={styles.closeBtn} onClick={handleClose}>
            <FaChevronDown />
          </button>
        </header>

        <div className={lyricsStyles.container}>
          {/* 좌측: 앨범 아트 섹션 (데스크탑 전용) */}
          <div className={lyricsStyles.albumSection}>
            <div className={lyricsStyles.albumArtWrapper}>
              <Image
                key={currentTrack.id}
                src={currentTrack.image || "/default-playlist.jpg"}
                alt={currentTrack.name}
                fill
                priority
                sizes="(max-width: 1024px) 0vw, 500px"
                className={`${styles.albumArt} ${isPlaying ? styles.playing : ""}`}
              />
            </div>
            <div className={lyricsStyles.trackInfo}>
              <h1 className={lyricsStyles.trackName}>{currentTrack.name}</h1>
              <p className={lyricsStyles.artistName}>{currentTrack.artists.join(", ")}</p>
            </div>
            
            {/* 데스크탑용 컨트롤러 */}
            <div className={styles.playerInfo} style={{ marginTop: '2rem' }}>
              <DetailProgressBar />
              <div className={styles.controls}>
                <button className={`${styles.subBtn} ${isShuffled ? styles.active : ""}`} onClick={toggleShuffle}>
                  <FaRandom />
                </button>
                <button className={styles.mainBtn} onClick={prevTrack}>
                  <FaStepBackward />
                </button>
                <button className={styles.playToggle} onClick={togglePlay}>
                  {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: "4px" }} />}
                </button>
                <button className={styles.mainBtn} onClick={() => nextTrack()}>
                  <FaStepForward />
                </button>
                <button className={`${styles.subBtn} ${repeatMode !== "off" ? styles.active : ""}`} onClick={cycleRepeatMode}>
                  <FaRetweet size={25} />
                  {repeatMode === "track" && <span className={styles.repeatOne}>1</span>}
                </button>
              </div>
            </div>
          </div>

          {/* 우측: 가사 섹션 */}
          <div className={lyricsStyles.lyricsSection}>
            {isLoading ? (
              <div className={lyricsStyles.noLyrics}>
                <LoadingDots />
              </div>
            ) : error ? (
              <div className={lyricsStyles.noLyrics}>{error}</div>
            ) : lyrics && lyrics.lines.length > 0 ? (
              <div className={lyricsStyles.lyricsList} ref={scrollRef}>
                {lyrics.lines.map((line, index) => (
                  <div
                    key={`${line.time}-${index}`}
                    ref={index === activeIndex ? activeLineRef : null}
                    className={`${lyricsStyles.lyricLine} ${
                      index === activeIndex ? lyricsStyles.activeLine : ""
                    }`}
                  >
                    {line.text}
                  </div>
                ))}
              </div>
            ) : lyrics?.plainLyrics ? (
              <div className={lyricsStyles.lyricsList}>
                <div className={lyricsStyles.plainLyrics}>{lyrics.plainLyrics}</div>
              </div>
            ) : (
              <div className={lyricsStyles.noLyrics}>가사 정보가 없습니다.</div>
            )}

            {/* 모바일용 컨트롤러 (가사 하단에 배치) */}
            <div className={`${styles.playerInfo} ${lyricsStyles.mobileControls}`} style={{ marginTop: 'auto', paddingTop: '2rem' }}>
              <DetailProgressBar />
              <div className={styles.controls}>
                <button className={`${styles.subBtn} ${isShuffled ? styles.active : ""}`} onClick={toggleShuffle}>
                  <FaRandom />
                </button>
                <button className={styles.mainBtn} onClick={prevTrack}>
                  <FaStepBackward />
                </button>
                <button className={styles.playToggle} onClick={togglePlay}>
                  {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: "4px" }} />}
                </button>
                <button className={styles.mainBtn} onClick={() => nextTrack()}>
                  <FaStepForward />
                </button>
                <button className={`${styles.subBtn} ${repeatMode !== "off" ? styles.active : ""}`} onClick={cycleRepeatMode}>
                  <FaRetweet size={25} />
                  {repeatMode === "track" && <span className={styles.repeatOne}>1</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
