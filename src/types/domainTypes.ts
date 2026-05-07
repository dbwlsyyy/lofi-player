/**
 * 우리 앱의 UI에서 최종적으로 소비하는 깔끔한 도메인 타입 정의
 * 접두사 없이 명사로 작성하며, UI 렌더링에 최적화된 구조를 가짐
 */

export type SearchFilter = "track" | "artist" | "album" | "playlist";

export interface Track {
  id: string;
  name: string;
  artists: string[];
  image: string;
  durationMs: number;
  uri: string;
  previewUrl?: string;
  uniqueKey?: string; // 리스트 렌더링용 고유 키
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  uri: string;
  genres: string[];
  followers: number;
}

export interface Album {
  id: string;
  name: string;
  image: string;
  releaseDate: string;
  type: string;
  artists: string[];
  uri: string;
  totalTracks?: number;
  label?: string;
  copyrights?: string[];
  tracks?: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  image: string;
  description: string;
  owner: string;
  ownerId: string;
  tracksTotal: number;
  uri: string;
  tracks?: Track[];
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  image: string;
  product?: string;
}

/**
 * 가사 데이터 타입
 */
export interface LyricLine {
  time: number; // 밀리초 단위 시간
  text: string; // 가사 텍스트
}

export interface LyricsData {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  plainLyrics?: string;
  syncedLyrics?: string;
  lines: LyricLine[]; // 파싱된 가사 줄 목록
}
