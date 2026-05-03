import { SearchResult } from "@/types/api";
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
