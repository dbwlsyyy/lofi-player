import axios from "axios";
import * as Sentry from "@sentry/nextjs";
import { LyricsData, LyricLine } from "@/types/domainTypes";

/**
 * LRC 포맷 가사를 파싱하여 LyricLine 배열로 변환
 * [mm:ss.xx] 가사 텍스트 -> { time: ms, text: string }
 */
const parseSyncedLyrics = (lrc: string | null | undefined): LyricLine[] => {
  if (!lrc) return [];

  const lines = lrc.split("\n");
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  lines.forEach((line) => {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1]!, 10);
      const seconds = parseInt(match[2]!, 10);
      const milliseconds = parseInt(match[3]!.padEnd(3, "0"), 10);
      const time = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
      const text = line.replace(timeRegex, "").trim();

      if (text) {
        result.push({ time, text });
      }
    }
  });

  return result.sort((a, b) => a.time - b.time);
};

/**
 * LRCLIB API를 통해 가사 정보 조회
 */
export const fetchLyrics = async (
  trackName: string,
  artistName: string,
  albumName: string,
  duration: number,
): Promise<LyricsData | null> => {
  try {
    const response = await axios.get("https://lrclib.net/api/get", {
      params: {
        track_name: trackName,
        artist_name: artistName,
        album_name: albumName,
        duration: Math.floor(duration / 1000),
      },
    });

    const data = response.data;

    return {
      id: data.id,
      trackName: data.trackName,
      artistName: data.artistName,
      albumName: data.albumName,
      duration: data.duration,
      plainLyrics: data.plainLyrics,
      syncedLyrics: data.syncedLyrics,
      lines: data.syncedLyrics ? parseSyncedLyrics(data.syncedLyrics) : [],
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { trackName, artistName, albumName, duration } });
    console.error("가사 조회 실패:", error);
    return null;
  }
};
