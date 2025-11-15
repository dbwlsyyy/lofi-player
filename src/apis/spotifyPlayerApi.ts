import { spotifyApi } from './spotifyApi';

export async function transferToDevice(deviceId: string, accessToken: string) {
    return spotifyApi.put(
        'me/player',
        {
            device_ids: [deviceId],
            play: false,
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
}

export async function playTrack(
    uris: string[],
    deviceId: string,
    accessToken: string
) {
    return spotifyApi.put(
        `me/player/play?device_id=${deviceId}`,
        { uris },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
}

export async function pauseTrack(deviceId: string, accessToken: string) {
    return spotifyApi.put(
        `me/player/pause?device_id=${deviceId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
}

export async function nextTrack(deviceId: string, accessToken: string) {
    return spotifyApi.post(
        `me/player/next?device_id=${deviceId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
}
