/**
 * Spotify API 응답 구조와 1:1 매칭되는 Raw Type 정의
 * 모든 타입에 SpotifyApi 접두사를 붙여 도메인 타입과 구분함
 */

export interface SpotifyApiImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyApiUser {
  display_name: string;
  email: string;
  id: string;
  images: SpotifyApiImage[];
  product?: string;
}

export interface SpotifyApiArtist {
  id: string;
  name: string;
  uri: string;
  images?: SpotifyApiImage[];
  genres?: string[];
  followers?: {
    total: number;
  };
}

export interface SpotifyApiAlbum {
  id: string;
  name: string;
  images: SpotifyApiImage[];
  release_date: string;
  album_type: string;
  artists: SpotifyApiArtist[];
  total_tracks?: number;
  label?: string;
  copyrights?: { text: string; type: string }[];
  tracks?: {
    items: SpotifyApiTrack[];
  };
}

export interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: SpotifyApiArtist[];
  album: SpotifyApiAlbum;
  duration_ms: number;
  uri: string;
  preview_url: string | null;
}

export interface SpotifyApiPlaylist {
  id: string;
  name: string;
  images: SpotifyApiImage[];
  description: string;
  owner: {
    id: string;
    display_name: string;
  };
  tracks: {
    total: number;
    items?: {
      track: SpotifyApiTrack;
    }[];
  };
  uri: string;
}

export interface SpotifyApiSearchResponse {
  tracks?: { items: SpotifyApiTrack[] };
  artists?: { items: SpotifyApiArtist[] };
  albums?: { items: SpotifyApiAlbum[] };
  playlists?: { items: SpotifyApiPlaylist[] };
}
