import { createSpotifyClient } from "@/lib/spotifyClient";
import { SpotifyApiUser, SpotifyApiPlaylist, SpotifyApiTrack } from "@/types/spotifyApiTypes";
import { User, Playlist, Track } from "@/types/domainTypes";
import {
  mapSpotifyApiUserToUser,
  mapSpotifyApiPlaylistToPlaylist,
  mapSpotifyApiTrackToTrack,
} from "@/lib/spotifyMapper";
import axios, { AxiosError } from "axios";

/**
 * 유저(User) 관련 API
 * 내 프로필, 내 플레이리스트 관리 등 개인화된 기능 담당
 */

export async function fetchMe(accessToken: string, signal?: AbortSignal): Promise<User> {
  const api = createSpotifyClient(accessToken);
  try {
    const { data } = await api.get<SpotifyApiUser>("/me", { ...(signal ? { signal } : {}) });
    return mapSpotifyApiUserToUser(data);
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;
    const axiosError = error as AxiosError;
    console.error("fetchMe API 에러:", axiosError.response?.status, axiosError.message);
    throw error;
  }
}

export async function fetchMyPlaylistList(
  accessToken: string,
  signal?: AbortSignal,
): Promise<Playlist[]> {
  const api = createSpotifyClient(accessToken);
  try {
    const { data } = await api.get<{ items: SpotifyApiPlaylist[] }>("/me/playlists", {
      ...(signal ? { signal } : {}),
    });
    return data.items.map(mapSpotifyApiPlaylistToPlaylist);
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;
    console.error("fetchMyPlaylistList API 에러:", error);
    throw error;
  }
}

export async function fetchAllTracksInPlaylist(
  accessToken: string,
  playlistId: string,
  signal?: AbortSignal,
): Promise<Track[]> {
  const api = createSpotifyClient(accessToken);
  const MAX_TRACKS = 1000; // 안전장치 (최대 1000곡)
  const limit = 100; // 스포티파이 최대 리밋

  let allTracks: Track[] = [];
  let offset = 0;
  let hasNext = true;

  try {
    // 다음 페이지가 없을 때까지(hasNext === false) 계속 요청
    while (hasNext && allTracks.length < MAX_TRACKS) {
      const { data } = await api.get<{
        items: { track: SpotifyApiTrack }[];
        total: number; // 플레이리스트의 총 곡 수
      }>(`/playlists/${playlistId}/tracks`, {
        params: { limit, offset }, // 건너뛰기
        ...(signal ? { signal } : {}),
      });

      // 받은 100곡을 도메인 타입으로 맵핑
      const validTracks = data.items
        .filter((item) => !!item.track)
        .map((item) => mapSpotifyApiTrackToTrack(item.track));

      allTracks = [...allTracks, ...validTracks];

      if (
        allTracks.length >= data.total ||
        data.items.length === 0 ||
        allTracks.length >= MAX_TRACKS
      ) {
        hasNext = false;
      } else {
        offset += limit;
      }
    }

    return allTracks;
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;
    console.error(`fetchAllTracksInPlaylist(${playlistId}) 에러:`, error);
    throw error;
  }
}

export async function updatePlaylistName(
  accessToken: string,
  playlistId: string,
  newName: string,
): Promise<boolean> {
  const api = createSpotifyClient(accessToken);
  try {
    await api.put(`/playlists/${playlistId}`, { name: newName });
    return true;
  } catch (error: unknown) {
    console.error("updatePlaylistName 에러:", error);
    throw error;
  }
}

export async function removeTrackFromPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string,
): Promise<boolean> {
  const api = createSpotifyClient(accessToken);
  try {
    await api.delete(`/playlists/${playlistId}/tracks`, {
      data: { tracks: [{ uri: trackUri }] },
    });
    return true;
  } catch (error: unknown) {
    console.error("removeTrackFromPlaylist 에러:", error);
    throw error;
  }
}

export async function addTrackToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string,
): Promise<boolean> {
  const api = createSpotifyClient(accessToken);
  try {
    await api.post(`/playlists/${playlistId}/tracks`, { uris: [trackUri] });
    return true;
  } catch (error: unknown) {
    console.error("addTrackToPlaylist 에러:", error);
    throw error;
  }
}
