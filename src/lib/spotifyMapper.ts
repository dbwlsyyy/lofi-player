import type { Track } from '@/store/usePlayerStore';

// SDK Track → Local Track 변환
export function mapSdkTrackToLocalTrack(sdkTrack: Spotify.Track): Track {
    return {
        id: sdkTrack.id ?? '',
        name: sdkTrack.name,
        artists: sdkTrack.artists.map((a) => a.name),
        image: sdkTrack.album.images?.[0]?.url ?? '',
    };
}

// 배열 버전
export function mapSdkTrackListToLocalList(
    sdkTracks: Spotify.Track[]
): Track[] {
    return sdkTracks.map((t) => mapSdkTrackToLocalTrack(t));
}
