// API 통신 시 요청(Request)/응답(Response)에 쓰이는 데이터 타입

export interface SpotifyUser {
  display_name: string;
  email: string;
  id: string;
  images: { url: string }[];
  product?: string; // 프리미엄 여부 등
}

export interface SpotifyPlaylistItem {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  // owner?: { display_name: string };
}

export interface SpotifyPlaylistResponse {
  items: SpotifyPlaylistItem[];
}

export type SearchFilter = "track" | "artist" | "album" | "playlist"; // all 제거

export interface SearchResult {
  id: string;
  name: string;
  image: string;
  type: SearchFilter;
  uri: string;
  artists?: string[];
  durationMs?: number;
  releaseDate?: string; // 앨범 정렬용
  owner?: string; // 플레이리스트 제작자용
  tracksTotal?: number; // 곡 수 추가
  description?: string; // 설명 추가
}
