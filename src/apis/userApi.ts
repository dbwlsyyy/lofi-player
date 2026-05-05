import { createSpotifyClient } from "@/lib/spotifyClient";
import { 
  SpotifyApiUser, 
  SpotifyApiPlaylist, 
  SpotifyApiTrack 
} from "@/types/spotifyApiTypes";
import { 
  User, 
  Playlist, 
  Track 
} from "@/types/domainTypes";
import { 
  mapSpotifyApiUserToUser, 
  mapSpotifyApiPlaylistToPlaylist, 
  mapSpotifyApiTrackToTrack 
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

export async function fetchPlaylists(
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
    console.error("fetchPlaylists API 에러:", error);
    throw error;
  }
}

export async function fetchPlaylistTracks(
  accessToken: string,
  playlistId: string,
  signal?: AbortSignal,
): Promise<Track[]> {
  const api = createSpotifyClient(accessToken);
  try {
    const { data } = await api.get<{ items: { track: SpotifyApiTrack }[] }>(`/playlists/${playlistId}/tracks`, {
      ...(signal ? { signal } : {}),
    });

    return data.items
      .filter(item => !!item.track)
      .map(item => mapSpotifyApiTrackToTrack(item.track));
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;
    console.error(`fetchPlaylistTracks(${playlistId}) 에러:`, error);
    throw error;
  }
}

export async function updatePlaylistName(
  accessToken: string, 
  playlistId: string, 
  newName: string
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
