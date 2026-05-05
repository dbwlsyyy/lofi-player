// types/spotify.ts
import { Track } from "./player";

// ==========================================
// 1. 스포티파이 원본 데이터 타입 (Raw API Response)
// ==========================================

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyUser {
  display_name: string;
  email: string;
  id: string;
  images: SpotifyImage[];
  product?: string;
}

export interface SpotifyPlaylistItem {
  id: string;
  name: string;
  images: SpotifyImage[];
  tracks: { total: number };
  owner?: { display_name: string };
}

export interface SpotifyPlaylistResponse {
  items: SpotifyPlaylistItem[];
}

export interface SpotifyArtistDetailed {
  id: string;
  name: string;
  uri: string;
  images: SpotifyImage[];
  genres: string[];
  followers: {
    total: number;
  };
}

// ==========================================
// 2. UI 전용 가공 데이터 타입 (View Model)
// ==========================================

export type SearchFilter = "track" | "artist" | "album" | "playlist";

// 디깅 페이지 검색 결과용 타입
export interface SearchResult {
  id: string;
  name: string;
  image: string;
  type: SearchFilter;
  uri: string;
  artists?: string[];
  durationMs?: number;
  releaseDate?: string;
  owner?: string;
  tracksTotal?: number;
  description?: string;
}

// 앨범 간략 정보 (디깅 페이지 / 아티스트 상세 페이지용)
export interface SpotifyAlbumSimplified {
  id: string;
  name: string;
  image: string;
  releaseDate: string;
  type: string;
  artists?: string[];
}

// 앨범 상세 정보 타입
export interface SpotifyAlbumDetailed extends SpotifyAlbumSimplified {
  tracks: Track[];
  copyrights: { text: string; type: string }[];
  label: string;
}

// 아티스트 상세 페이지 전체 데이터 모델
export interface ArtistPageData {
  artist: SpotifyArtistDetailed;
  topTracks: Track[];
  albums: SpotifyAlbumSimplified[];
}

export interface SpotifyPlaylistDetailed {
  id: string;
  name: string;
  owner: string; // 제작자 이름 (display_name)
  image: string; // 플레이리스트 커버 이미지
  description: string | null;
  tracks: Track[]; // 내부에 포함된 곡 데이터 배열
}
