import { 
  SpotifyApiTrack, 
  SpotifyApiArtist, 
  SpotifyApiAlbum, 
  SpotifyApiPlaylist, 
  SpotifyApiUser 
} from "@/types/spotifyApiTypes";
import { 
  Track, 
  Artist, 
  Album, 
  Playlist, 
  User, 
  SearchResult 
} from "@/types/domainTypes";

/**
 * Spotify API Raw Data를 우리 앱의 Domain Data로 변환하는 매퍼 모음
 * 모든 함수는 방어적 코드(Optional Chaining, Default Value)를 포함함
 */

export const mapSpotifyApiTrackToTrack = (apiTrack: SpotifyApiTrack): Track => ({
  id: apiTrack.id || "",
  name: apiTrack.name || "Unknown Title",
  artists: apiTrack.artists?.map(a => a.name) || [],
  image: apiTrack.album?.images?.[0]?.url || "/default_album.png",
  durationMs: apiTrack.duration_ms || 0,
  uri: apiTrack.uri || "",
  previewUrl: apiTrack.preview_url || undefined,
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
  artists: apiAlbum.artists?.map(a => a.name) || [],
  totalTracks: apiAlbum.total_tracks || 0,
  label: apiAlbum.label || "",
  copyrights: apiAlbum.copyrights?.map(c => c.text) || [],
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
  tracks: apiPlaylist.tracks?.items?.map(item => mapSpotifyApiTrackToTrack(item.track)) || [],
});

export const mapSpotifyApiUserToUser = (apiUser: SpotifyApiUser): User => ({
  id: apiUser.id || "",
  displayName: apiUser.display_name || "Unknown User",
  email: apiUser.email || "",
  image: apiUser.images?.[0]?.url || "/default_user.png",
  product: apiUser.product,
});

// SearchResult 변환 매퍼 (디깅 페이지용)
export const mapTrackToSearchResult = (track: Track): SearchResult => ({
  id: track.id,
  name: track.name,
  image: track.image,
  type: "track",
  uri: track.uri,
  artists: track.artists,
  durationMs: track.durationMs,
});

export const mapArtistToSearchResult = (artist: Artist): SearchResult => ({
  id: artist.id,
  name: artist.name,
  image: artist.image,
  type: "artist",
  uri: artist.uri,
});

export const mapAlbumToSearchResult = (album: Album): SearchResult => ({
  id: album.id,
  name: album.name,
  image: album.image,
  type: "album",
  uri: album.uri,
  artists: album.artists,
  releaseDate: album.releaseDate,
});

export const mapPlaylistToSearchResult = (playlist: Playlist): SearchResult => ({
  id: playlist.id,
  name: playlist.name,
  image: playlist.image,
  type: "playlist",
  uri: playlist.uri,
  owner: playlist.owner,
  tracksTotal: playlist.tracksTotal,
  description: playlist.description,
});
