import {
  SpotifyApiTrack,
  SpotifyApiArtist,
  SpotifyApiAlbum,
  SpotifyApiPlaylist,
  SpotifyApiUser,
} from "@/types/spotifyApiTypes";
import { Track, Artist, Album, Playlist, User } from "@/types/domainTypes";

/**
 * Spotify API Raw Data를 우리 앱의 Domain Data로 변환하는 매퍼 모음
 * 모든 함수는 방어적 코드(Optional Chaining, Default Value)를 포함함
 */

export const mapSpotifyApiTrackToTrack = (apiTrack: SpotifyApiTrack): Track => ({
  id: apiTrack.id || "",
  name: apiTrack.name || "Unknown Title",
  artists: apiTrack.artists?.map((a) => a.name) || [],
  image: apiTrack.album?.images?.[0]?.url || "/default_album.png",
  durationMs: apiTrack.duration_ms || 0,
  uri: apiTrack.uri || "",
  previewUrl: apiTrack.preview_url || "",
  uniqueKey: crypto.randomUUID(),
});

export const mapSpotifyApiArtistToArtist = (apiArtist: SpotifyApiArtist): Artist => ({
  id: apiArtist.id || "",
  name: apiArtist.name || "Unknown Artist",
  image: apiArtist.images?.[0]?.url || "/default_artist.png",
  uri: apiArtist.uri || "",
  genres: apiArtist.genres || [],
  followers: apiArtist.followers?.total || 0,
});

export const mapSpotifyApiAlbumToAlbum = (apiAlbum: SpotifyApiAlbum): Album => ({
  id: apiAlbum.id || "",
  name: apiAlbum.name || "Unknown Album",
  image: apiAlbum.images?.[0]?.url || "/default_album.png",
  releaseDate: apiAlbum.release_date || "",
  type: apiAlbum.album_type || "album",
  artists: apiAlbum.artists?.map((a) => a.name) || [],
  totalTracks: apiAlbum.total_tracks || 0,
  label: apiAlbum.label || "",
  uri: apiAlbum.uri || "",
  copyrights: apiAlbum.copyrights?.map((c) => c.text) || [],
  tracks: apiAlbum.tracks?.items?.map(mapSpotifyApiTrackToTrack) || [],
});

export const mapSpotifyApiPlaylistToPlaylist = (apiPlaylist: SpotifyApiPlaylist): Playlist => ({
  id: apiPlaylist.id || "",
  name: apiPlaylist.name || "Unknown Playlist",
  image: apiPlaylist.images?.[0]?.url || "/default_playlist.png",
  description: apiPlaylist.description || "",
  owner: apiPlaylist.owner?.display_name || "Unknown Owner",
  ownerId: apiPlaylist.owner?.id || "",
  tracksTotal: apiPlaylist.tracks?.total || 0,
  uri: apiPlaylist.uri || "",
  tracks: apiPlaylist.tracks?.items?.map((item) => mapSpotifyApiTrackToTrack(item.track)) || [],
});

export const mapSpotifyApiUserToUser = (apiUser: SpotifyApiUser): User => ({
  id: apiUser.id || "",
  displayName: apiUser.display_name || "Unknown User",
  email: apiUser.email || "",
  image: apiUser.images?.[0]?.url || "/default_user.png",
  product: apiUser.product || "",
});

// 웹 플레이어 SDK Track -> Local Domain Track 변환
export const mapSpotifySdkTrackToTrack = (sdkTrack: Spotify.Track): Track => ({
  id: sdkTrack.id ?? "",
  name: sdkTrack.name || "Unknown Title",
  artists: sdkTrack.artists.map((a) => a.name) || [],
  image: sdkTrack.album.images?.[0]?.url ?? "/default_album.png",
  durationMs: sdkTrack.duration_ms || 0,
  uri: sdkTrack.uri || "",
  previewUrl: "", // SDK 트랙에는 미리듣기가 없으므로 빈 문자열
  uniqueKey: crypto.randomUUID(),
});
