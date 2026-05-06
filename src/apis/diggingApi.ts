import { createSpotifyClient } from "@/lib/spotifyClient";
import {
  SpotifyApiSearchResponse,
  SpotifyApiArtist,
  SpotifyApiTrack,
  SpotifyApiAlbum,
  SpotifyApiPlaylist,
} from "@/types/spotifyApiTypes";
import { Artist, Track, Album, Playlist, SearchFilter } from "@/types/domainTypes";
import {
  mapSpotifyApiArtistToArtist,
  mapSpotifyApiTrackToTrack,
  mapSpotifyApiAlbumToAlbum,
  mapSpotifyApiPlaylistToPlaylist,
} from "@/lib/spotifyMapper";
import axios, { AxiosError } from "axios";

/**
 * 탐색(Digging) 관련 API
 * 모든 함수는 Domain Type을 반환하며, 내부에서 Mapper를 통해 가공함
 */

export async function searchSpotify(
  accessToken: string,
  query: string,
  filter: SearchFilter,
  offset: number = 0,
  signal?: AbortSignal,
): Promise<Track[] | Artist[] | Album[] | Playlist[]> {
  if (!query.trim()) return [];

  const api = createSpotifyClient(accessToken);

  try {
    const { data } = await api.get<SpotifyApiSearchResponse>("/search", {
      params: { q: query, type: filter, limit: 30, offset },
      ...(signal ? { signal } : {}),
    });

    if (filter === "artist" && data.artists) {
      return data.artists.items.map(mapSpotifyApiArtistToArtist);
    }

    if (filter === "album" && data.albums) {
      return data.albums.items.map(mapSpotifyApiAlbumToAlbum);
    }

    if (filter === "playlist" && data.playlists) {
      return data.playlists.items.filter((pl) => pl !== null).map(mapSpotifyApiPlaylistToPlaylist);
    }

    if (filter === "track" && data.tracks) {
      return data.tracks.items.map(mapSpotifyApiTrackToTrack);
    }

    return [];
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;
    const axiosError = error as AxiosError;
    console.error("searchSpotify API 에러:", axiosError.response?.status, axiosError.message);
    throw error;
  }
}

export async function fetchArtist(
  accessToken: string,
  artistId: string,
  signal?: AbortSignal,
): Promise<Artist> {
  const api = createSpotifyClient(accessToken);
  try {
    const { data } = await api.get<SpotifyApiArtist>(`/artists/${artistId}`, {
      ...(signal ? { signal } : {}),
    });
    return mapSpotifyApiArtistToArtist(data);
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;
    console.error(`fetchArtist(${artistId}) 에러:`, error);
    throw error;
  }
}

export async function fetchArtistTopTracks(
  accessToken: string,
  artistId: string,
  market: string = "KR",
  signal?: AbortSignal,
): Promise<Track[]> {
  const api = createSpotifyClient(accessToken);
  try {
    const { data } = await api.get<{ tracks: SpotifyApiTrack[] }>(
      `/artists/${artistId}/top-tracks`,
      {
        params: { market },
        ...(signal ? { signal } : {}),
      },
    );
    return data.tracks.map(mapSpotifyApiTrackToTrack);
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;
    console.error(`fetchArtistTopTracks(${artistId}) 에러:`, error);
    throw error;
  }
}

export async function fetchArtistAlbums(
  accessToken: string,
  artistId: string,
  limit: number = 20,
  offset: number = 0,
  signal?: AbortSignal,
): Promise<Album[]> {
  const api = createSpotifyClient(accessToken);
  try {
    const { data } = await api.get<{ items: SpotifyApiAlbum[] }>(`/artists/${artistId}/albums`, {
      params: { limit, offset, include_groups: "album,single" },
      ...(signal ? { signal } : {}),
    });
    return data.items.map(mapSpotifyApiAlbumToAlbum);
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;
    console.error(`fetchArtistAlbums(${artistId}) 에러:`, error);
    throw error;
  }
}

export async function fetchAlbum(
  accessToken: string,
  albumId: string,
  signal?: AbortSignal,
): Promise<Album> {
  const api = createSpotifyClient(accessToken);
  try {
    const { data } = await api.get<SpotifyApiAlbum>(`/albums/${albumId}`, {
      ...(signal ? { signal } : {}),
    });
    return mapSpotifyApiAlbumToAlbum(data);
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;
    console.error(`fetchAlbum(${albumId}) 에러:`, error);
    throw error;
  }
}

export async function fetchPlaylist(
  accessToken: string,
  playlistId: string,
  signal?: AbortSignal,
): Promise<Playlist> {
  const api = createSpotifyClient(accessToken);
  try {
    const { data } = await api.get<SpotifyApiPlaylist>(`/playlists/${playlistId}`, {
      ...(signal ? { signal } : {}),
    });
    return mapSpotifyApiPlaylistToPlaylist(data);
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;
    console.error(`fetchPlaylist(${playlistId}) 에러:`, error);
    throw error;
  }
}
