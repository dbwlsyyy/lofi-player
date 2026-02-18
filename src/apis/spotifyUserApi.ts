import { Track } from "@/store/usePlayerStore";
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

export async function fetchPlaylists(accessToken: string): Promise<SpotifyPlaylistItem[]> {
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
    console.error(`fetchPlaylistTracks(${playlistId}) error:`, e.response?.status, e.message);
    throw e;
  }
}

// 플레이리스트 이름 수정 API
export async function updatePlaylistName(accessToken: string, playlistId: string, newName: string) {
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

// 트랙 검색 API (Digging용)
export async function searchTracks(accessToken: string, query: string): Promise<Track[]> {
  if (!query.trim()) return [];

  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get("/search", {
      params: {
        q: query,
        type: "track",
        limit: 20, // 검색 결과 개수 제한
      },
    });

    // 기존 Track 인터페이스 형식으로 데이터 가공
    return data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => a.name),
      image: track.album.images?.[0]?.url ?? "/default_album.png",
      durationMs: track.duration_ms,
      uri: track.uri,
      previewUrl: track.preview_url ?? undefined,
    }));
  } catch (e: any) {
    console.error("검색 실패:", e.response?.status, e.message);
    throw e;
  }
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
