"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import styles from "./PlayerBar.module.css";
import Image from "next/image";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaRandom,
  FaRedo,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { formatTime } from "@/lib/formatTime";
import { useRef } from "react";
import LoadingDots from "../../loading/LoadingDots/LoadingDots";
import { useUiStore } from "@/store/useUiStore";
import Link from "next/link";
import { useShallow } from "zustand/shallow";

const PlayerProgressBar = () => {
  const position = usePlayerStore((state) => state.position);
  const duration = usePlayerStore((state) => state.duration);
  const seekTo = usePlayerStore((state) => state.seekTo);

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPosition = Math.floor((clickX / rect.width) * duration);
    seekTo(newPosition);
  };

  return (
    <div className={styles.progressContainer}>
      <span className={styles.timeText}>{formatTime(position)}</span>
      <div
        className={styles.progressBar}
        onClick={handleSeek}
      >
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <span className={styles.timeText}>{formatTime(duration)}</span>
    </div>
  );
};

export default function PlayerBar() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const {
    currentTrack,
    isPlaying,
    isShuffled,
    repeatMode,
    volume,
    isLoadingTrack,
    cycleRepeatMode,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    toggleShuffle,
  } = usePlayerStore(
    useShallow((state) => ({
      currentTrack: state.currentTrack,
      isPlaying: state.isPlaying,
      isShuffled: state.isShuffled,
      repeatMode: state.repeatMode,
      volume: state.volume,
      isLoadingTrack: state.isLoadingTrack,
      cycleRepeatMode: state.cycleRepeatMode,
      togglePlay: state.togglePlay,
      nextTrack: state.nextTrack,
      prevTrack: state.prevTrack,
      setVolume: state.setVolume,
      toggleShuffle: state.toggleShuffle,
    })),
  );
  const { toggleSidebar } = useUiStore();
  const lastVolumeRef = useRef(volume || 0.5);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value) / 100;
    setVolume(newVolume);

    if (newVolume > 0) {
      lastVolumeRef.current = newVolume;
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      lastVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(lastVolumeRef.current);
    }
  };

  return (
    <footer className={styles.playerBar}>
      <AnimatePresence mode="popLayout">
        {currentTrack ? (
          <>
            <div className={styles.leftArea}>
              <AnimatePresence>
                <motion.div
                  //같은 곡이 연속으로 나와도 무조건 슬라이드 되도록 uniqueKey 우선 적용
                  key={currentTrack.uniqueKey || currentTrack.id}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{
                    type: "spring",
                    stiffness: 300, // 쫀득한 탄성
                    damping: 30, // 튕김 방지
                    mass: 1,
                    duration: 0.4,
                    ease: [0.5, 0.5, 0.5, 1],
                  }}
                  className={styles.trackInfo}
                >
                  <Link
                    href={`/song/${currentTrack.id}`}
                    className={styles.albumArtWrapper}
                  >
                    <Image
                      src={currentTrack.image}
                      alt={currentTrack.name}
                      fill
                      sizes="6rem"
                      className={`${styles.albumArt} ${isPlaying ? styles.playingArt : ""}`}
                    />
                  </Link>
                  <div className={styles.textInfo}>
                    <p className={styles.trackName}>{currentTrack.name}</p>
                    <p className={styles.trackArtist}>{currentTrack.artists.join(", ")}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className={styles.centerArea}>
              <div className={styles.controls}>
                {isLoadingTrack ? (
                  <LoadingDots />
                ) : (
                  <>
                    <button
                      onClick={() => accessToken && toggleShuffle(accessToken)}
                      className={`${styles.controlBtn}  ${isShuffled ? styles.activeBtn : ""}`}
                      title="셔플 켜기/끄기"
                    >
                      <FaRandom size={17} />
                    </button>
                    <button
                      onClick={prevTrack}
                      className={styles.controlBtn}
                    >
                      <FaStepBackward style={{ marginLeft: "2rem" }} />
                    </button>
                    <button
                      disabled={isLoadingTrack}
                      onClick={togglePlay}
                      className={`${styles.controlBtn} ${styles.playBtn}`}
                    >
                      {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <button
                      onClick={nextTrack}
                      className={styles.controlBtn}
                    >
                      <FaStepForward style={{ marginRight: "2rem" }} />
                    </button>
                    <button
                      onClick={() => accessToken && cycleRepeatMode(accessToken)}
                      className={`${styles.controlBtn} ${repeatMode !== "off" ? styles.activeBtn : ""}`}
                      title={`반복 모드: ${repeatMode}`}
                    >
                      <FaRedo size={17} />
                      {repeatMode === "track" && <span className={styles.repeatSpan}>1</span>}
                    </button>
                  </>
                )}
              </div>

              <PlayerProgressBar />
            </div>

            <div className={styles.rightArea}>
              <div className={styles.volumeWrapper}>
                {volume === 0 ? (
                  <FaVolumeMute
                    className={styles.volumeIcon}
                    onClick={toggleMute}
                  />
                ) : (
                  <FaVolumeUp
                    className={styles.volumeIcon}
                    onClick={toggleMute}
                  />
                )}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className={styles.volumeSlider}
                  style={{
                    background: `linear-gradient(to right, #fff ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`,
                  }}
                />
              </div>
              <button
                className={styles.hamburger}
                onClick={toggleSidebar}
              >
                <FiMenu size={22} />
              </button>
            </div>
          </>
        ) : (
          <motion.div
            key="player-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={styles.emptyState}
          >
            <p>🎧 현재 재생 중인 곡이 없습니다.</p>
            <p className={styles.hint}>플레이리스트에서 곡을 선택하세요.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
