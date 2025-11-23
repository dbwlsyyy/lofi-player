import { createSpotifyClient } from '@/lib/spotifyClient';

export async function transferToDevice(deviceId: string, accessToken: string) {
    const client = createSpotifyClient(accessToken);

    return client.put('me/player', {
        device_ids: [deviceId],
        play: false,
    });
}

export async function startPlayback(
    uris: string[],
    deviceId: string,
    accessToken: string,
    offsetIndex?: number
) {
    const client = createSpotifyClient(accessToken);

    const body =
        offsetIndex !== undefined
            ? { uris, offset: { position: offsetIndex } }
            : { uris };

    return client.put(`me/player/play?device_id=${deviceId}`, body);
}

export async function pausePlayback(deviceId: string, accessToken: string) {
    const client = createSpotifyClient(accessToken);
    return client.put(`me/player/pause?device_id=${deviceId}`);
}

export async function nextTrack(deviceId: string, accessToken: string) {
    const client = createSpotifyClient(accessToken);
    return client.post(`me/player/next?device_id=${deviceId}`);
}

export async function prevTrack(deviceId: string, accessToken: string) {
    const client = createSpotifyClient(accessToken);
    return client.post(`me/player/previous?device_id=${deviceId}`);
}

export async function setShuffle(
    state: boolean,
    deviceId: string,
    accessToken: string
) {
    const client = createSpotifyClient(accessToken);
    return client.put(`me/player/shuffle?state=${state}&device_id=${deviceId}`);
}

export async function setRepeatMode(
    state: 'track' | 'context' | 'off',
    deviceId: string,
    accessToken: string
) {
    const client = createSpotifyClient(accessToken);
    return client.put(`me/player/repeat?state=${state}&device_id=${deviceId}`);
}
