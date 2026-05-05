// 유저 관련 Web API (JSDoc 포함)

import { Track } from "@/types/player";
import { createSpotifyClient } from "../lib/spotifyClient";
import {
  SearchFilter,
  SearchResult,
  SpotifyAlbumDetailed,
  SpotifyArtistDetailed,
  SpotifyPlaylistDetailed,
  SpotifyPlaylistItem,
  SpotifyPlaylistResponse,
  SpotifyUser,
} from "@/types/spotify";
import axios from "axios";

/**
 * [내 정보 가져오기]
 */
export async function fetchMe(accessToken: string, signal?: AbortSignal): Promise<SpotifyUser> {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get<SpotifyUser>("/me", { ...(signal ? { signal } : {}) });
    return data;
  } catch (e: any) {
    if (axios.isCancel(e)) {
      throw e;
    }
    console.error("fetchMe API 에러:", e.response?.status, e.message);
    throw e; // 다시 던짐 (호출부에서 처리)
  }
}

/**
 * [내 플레이리스트 목록 가져오기]
 */
export async function fetchPlaylists(
  accessToken: string,
  signal?: AbortSignal,
): Promise<SpotifyPlaylistItem[]> {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get<SpotifyPlaylistResponse>("/me/playlists", {
      ...(signal ? { signal } : {}),
    });
    return data.items;
  } catch (e: any) {
    if (axios.isCancel(e)) {
      throw e;
    }
    console.error("fetchPlaylist API 에러:", e.response?.status, e.message);
    throw e;
  }
}

/**
 * [특정 플리 트랙 가져오기]
 * 플레이리스트 ID를 던지면 Track[] 타입으로 변환해서 return
 */
export async function fetchPlaylistTracks(
  accessToken: string,
  playlistId: string,
  signal?: AbortSignal,
): Promise<Track[]> {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get(`/playlists/${playlistId}/tracks`, {
      ...(signal ? { signal } : {}),
    });

    // Spotify API의 응답 구조는 { items: [{ track: { ... } }] } 형태
    return data.items
      .filter((item: any) => !!item.track) // null 트랙 방지 (삭제된 곡 등)
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
    if (axios.isCancel(e)) {
      throw e;
    }
    console.error(`fetchPlaylistTracks(${playlistId}) 에러:`, e.response?.status, e.message);
    throw e;
  }
}

/**
 * [플리 이름 수정]
 */
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

/**
 * [플리에서 곡 삭제]
 */
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

/**
 * [플리에 곡 추가]
 */
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

/**
 * [디깅용]
 * 입력한 쿼리(query)와 필터(곡, 아티스트, 앨범, 플리)에 따라 Spotify DB에서 검색
 */
export async function searchSpotify(
  accessToken: string,
  query: string,
  filter: SearchFilter,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const api = createSpotifyClient(accessToken);

  try {
    // 필터에 맞는 type으로 요청
    const { data } = await api.get("/search", {
      params: { q: query, type: filter, limit: 30 },
      ...(signal ? { signal } : {}),
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
          owner: pl.owner.display_name || "정보 없음", // 제작자 이름
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
  } catch (e: any) {
    if (axios.isCancel(e)) {
      throw e;
    }
    console.error("searchSpotify API 에러:", e);
    throw e;
  }
}

/**
 * [아티스트 상세 정보 가져오기]
 */
export async function fetchArtist(accessToken: string, artistId: string, signal?: AbortSignal) {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get(`/artists/${artistId}`, {
      ...(signal ? { signal } : {}),
    });
    return data;
  } catch (e: any) {
    if (axios.isCancel(e)) throw e;
    console.error(`fetchArtist(${artistId}) 에러:`, e.response?.status, e.message);
    throw e;
  }
}

/**
 * [아티스트 인기 트랙 가져오기]
 */
export async function fetchArtistTopTracks(
  accessToken: string,
  artistId: string,
  market: string = "KR",
  signal?: AbortSignal,
): Promise<Track[]> {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get(`/artists/${artistId}/top-tracks`, {
      params: { market },
      ...(signal ? { signal } : {}),
    });

    return data.tracks.map((t: any) => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map((a: any) => a.name),
      image: t.album.images?.[0]?.url ?? "/default_album.png",
      durationMs: t.duration_ms,
      uri: t.uri,
      previewUrl: t.preview_url ?? undefined,
    }));
  } catch (e: any) {
    if (axios.isCancel(e)) throw e;
    console.error(`fetchArtistTopTracks(${artistId}) 에러:`, e.response?.status, e.message);
    throw e;
  }
}

/**
 * [아티스트 앨범 가져오기]
 */
export async function fetchArtistAlbums(
  accessToken: string,
  artistId: string,
  limit: number = 20,
  signal?: AbortSignal,
) {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get(`/artists/${artistId}/albums`, {
      params: { limit, include_groups: "album,single" },
      ...(signal ? { signal } : {}),
    });
    return data.items.map((al: any) => ({
      id: al.id,
      name: al.name,
      image: al.images?.[0]?.url || "/default_album.png",
      releaseDate: al.release_date,
      totalTracks: al.total_tracks,
      type: al.album_type,
    }));
  } catch (e: any) {
    if (axios.isCancel(e)) throw e;
    console.error(`fetchArtistAlbums(${artistId}) 에러:`, e.response?.status, e.message);
    throw e;
  }
}

/**
 * [앨범 상세 정보 가져오기]
 */
export async function fetchAlbum(
  accessToken: string,
  albumId: string,
  signal?: AbortSignal,
): Promise<SpotifyAlbumDetailed> {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get(`/albums/${albumId}`, {
      ...(signal ? { signal } : {}),
    });

    return {
      id: data.id,
      name: data.name,
      image: data.images?.[0]?.url || "/default_album.png",
      releaseDate: data.release_date,
      type: data.album_type,
      artists: data.artists.map((a: any) => a.name),
      label: data.label,
      copyrights: data.copyrights,
      tracks: data.tracks.items.map((t: any) => ({
        id: t.id,
        name: t.name,
        artists: t.artists.map((a: any) => a.name),
        image: data.images?.[0]?.url || "/default_album.png",
        durationMs: t.duration_ms,
        uri: t.uri,
        previewUrl: t.preview_url ?? undefined,
      })),
    };
  } catch (e: any) {
    if (axios.isCancel(e)) throw e;
    console.error(`fetchAlbum(${albumId}) 에러:`, e.response?.status, e.message);
    throw e;
  }
}

/**
 * [특정 플레이리스트 상세 정보(메타 + 트랙) 가져오기]
 */
export async function fetchPlaylist(
  accessToken: string,
  playlistId: string,
  signal?: AbortSignal,
): Promise<SpotifyPlaylistDetailed> {
  try {
    const api = createSpotifyClient(accessToken);
    const { data } = await api.get(`/playlists/${playlistId}`, {
      ...(signal ? { signal } : {}),
    });

    // 1. 내부 트랙 데이터를 프론트엔드 Track[] 구조로 예쁘게 매핑
    const mappedTracks = data.tracks.items
      .filter((item: any) => !!item.track) // null 트랙(삭제된 곡) 방어
      .map((item: any) => ({
        id: item.track!.id,
        name: item.track!.name,
        artists: item.track!.artists.map((a: SpotifyArtistDetailed) => a.name),
        image: item.track!.album.images?.[0]?.url ?? "/default_album.png",
        durationMs: item.track!.duration_ms,
        uri: item.track!.uri,
        previewUrl: item.track!.preview_url ?? undefined,
      }));

    // 2. 전체 플레이리스트 정보를 SpotifyPlaylistDetailed 타입으로 포장해서 리턴
    return {
      id: data.id,
      name: data.name,
      // display_name이 없을 경우 id(고유번호)를 폴백으로 사용
      owner: data.owner.display_name || data.owner.id,
      image: data.images?.[0]?.url || "/default_playlist.png",
      description: data.description,
      tracks: mappedTracks,
    };
  } catch (e: any) {
    if (axios.isCancel(e)) {
      throw e;
    }
    console.error(`fetchPlaylist(${playlistId}) API 에러:`, e.response?.status, e.message);
    throw e;
  }
}
