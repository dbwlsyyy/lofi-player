import { SearchResult } from "@/types/spotify";
import { Track } from "@/types/player";

// SDK Track → Local Track 변환
export function mapSdkTrackToLocalTrack(sdkTrack: Spotify.Track): Track {
  return {
    id: sdkTrack.id ?? "",
    name: sdkTrack.name,
    artists: sdkTrack.artists.map((a) => a.name),
    image: sdkTrack.album.images?.[0]?.url ?? "",
    durationMs: sdkTrack.duration_ms,
    uri: sdkTrack.uri,
    uniqueKey: crypto.randomUUID(),
  };
}

// 배열 버전
export function mapSdkTrackListToLocalList(sdkTracks: Spotify.Track[]): Track[] {
  return sdkTracks.map((t) => mapSdkTrackToLocalTrack(t));
}

// SearchResult → Local Track 변환
export function mapSearchResultToTrack(item: SearchResult): Track {
  return {
    id: item.id,
    name: item.name,
    artists: item.artists || [],
    image: item.image,
    uri: item.uri,
    durationMs: item.durationMs || 0,
    uniqueKey: crypto.randomUUID(),
  };
}

// Local Track → SearchResult 변환
export const mapTrackToSearchResult = (track: Track): SearchResult => ({
  id: track.id,
  name: track.name,
  image: track.image,
  type: "track", // TrackList에서 '트랙'으로 인식하게끔 고정
  uri: track.uri,
  artists: track.artists,
  durationMs: track.durationMs,
});
