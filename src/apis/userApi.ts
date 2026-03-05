import { Track } from "@/store/playerStore";
import { createSpotifyClient } from "../lib/spotifyClient";

export async function fetchMe(accessToken: string): Promise<SpotifyUser> {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get<SpotifyUser>("/me");
    return data;
  } catch (e: any) {
    console.error("fetchMe API Error:", e.response?.status, e.message);
    throw e; // 다시 던짐 (호출부에서 처리)
  }
}

export async function fetchPlaylists(
  accessToken: string,
): Promise<SpotifyPlaylistItem[]> {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get<SpotifyPlaylistResponse>("/me/playlists");
    return data.items;
  } catch (e: any) {
    console.error("fetchPlaylist API error:", e.response?.status, e.message);
    throw e;
  }
}

// 특정 플레이리스트의 트랙 목록 불러오기
export async function fetchPlaylistTracks(
  accessToken: string,
  playlistId: string,
): Promise<Track[]> {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get(`/playlists/${playlistId}/tracks`);

    // Spotify API의 응답 구조는 { items: [{ track: { ... } }] } 형태
    return data.items
      .filter((item: any) => !!item.track) // null 트랙 방지
      .map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map((a: any) => a.name),
        image: item.track.album.images?.[0]?.url ?? "/default_album.png",
        durationMs: item.track.duration_ms,
        uri: item.track.uri,
        previewUrl: item.track.preview_url ?? undefined,
      }));
  } catch (e: any) {
    console.error(
      `fetchPlaylistTracks(${playlistId}) error:`,
      e.response?.status,
      e.message,
    );
    throw e;
  }
}

// 플레이리스트 이름 수정 API
export async function updatePlaylistName(
  accessToken: string,
  playlistId: string,
  newName: string,
) {
  try {
    const api = createSpotifyClient(accessToken);
    await api.put(`/playlists/${playlistId}`, {
      name: newName,
    });
    return true;
  } catch (e: any) {
    console.error("이름 수정 실패:", e);
    throw e;
  }
}

export async function removeTrackFromPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string,
) {
  try {
    const api = createSpotifyClient(accessToken);
    console.log("삭제 요청 URI:", trackUri);
    await api.delete(`/playlists/${playlistId}/tracks`, {
      data: { tracks: [{ uri: trackUri }] },
    });
    return true;
  } catch (e: any) {
    console.error("곡 삭제 실패:", e);
    throw e;
  }
}

//
export interface SearchResult {
  id: string;
  name: string;
  image: string;
  type: "track" | "artist" | "album" | "playlist"; // playlist 추가
  uri: string;
  artists?: string[];
  durationMs?: number;
  releaseDate?: string; // 앨범 정렬용
  owner?: string; // 플레이리스트 제작자용
  tracksTotal?: number; // 곡 수 추가
  description?: string; // 설명 추가
}

export type SearchFilter = "track" | "artist" | "album" | "playlist"; // all 제거

export async function searchSpotify(
  accessToken: string,
  query: string,
  filter: SearchFilter,
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const api = createSpotifyClient(accessToken);

  // 필터에 맞는 type으로 요청
  const { data } = await api.get("/search", {
    params: { q: query, type: filter, limit: 30 },
  });

  // 1. 아티스트
  if (filter === "artist") {
    return data.artists.items.map((a: any) => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url || "/default_artist.png",
      type: "artist",
      uri: a.uri,
    }));
  }

  // 2. 앨범
  if (filter === "album") {
    return data.albums.items.map((al: any) => ({
      id: al.id,
      name: al.name,
      artists: al.artists.map((a: any) => a.name),
      image: al.images?.[0]?.url || "/default_album.png",
      type: "album",
      uri: al.uri,
      releaseDate: al.release_date, // 연도 파싱을 위해 필요
    }));
  }

  // 3. 플레이리스트 (NEW)
  if (filter === "playlist") {
    return data.playlists.items
      .filter((pl: any) => pl !== null)
      .map((pl: any) => ({
        id: pl.id,
        name: pl.name,
        image: pl.images?.[0]?.url || "/default_playlist.png",
        type: "playlist",
        uri: pl.uri,
        owner: pl.owner.display_name || "Unknown", // 제작자 이름
        tracksTotal: pl.tracks.total || 0,
        description: pl.description || "알 수 없음",
      }));
  }

  // 4. 곡 (기본)
  return data.tracks.items.map((t: any) => ({
    id: t.id,
    name: t.name,
    artists: t.artists.map((a: any) => a.name),
    image: t.album.images?.[0]?.url || "/default_album.png",
    type: "track",
    uri: t.uri,
    durationMs: t.duration_ms, // 시간 표시용
  }));
}

// 플레이리스트에 곡 추가 API
export async function addTrackToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string,
) {
  try {
    const api = createSpotifyClient(accessToken);
    // Spotify API 명세: POST /playlists/{playlist_id}/tracks
    await api.post(`/playlists/${playlistId}/tracks`, {
      uris: [trackUri], // 배열 형태로 전달해야 함
    });
    return true;
  } catch (e: any) {
    console.error("곡 추가 실패:", e.response?.status, e.message);
    throw e;
  }
}

export interface SpotifyUser {
  display_name: string;
  email: string;
  id: string;
  images: { url: string }[];
  product?: string;
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
