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
    accessToken: string,
    offsetIndex?: number
) {
    return spotifyApi.put(
        `me/player/play?device_id=${deviceId}`,
        offsetIndex !== undefined
            ? { uris, offset: { position: offsetIndex } }
            : { uris },
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

// spotify web playback SDK는 공식적으로 prev API를 지원하지 않기 때문에 직접 구현
export async function prevTrack(
    uris: string[],
    deviceId: string,
    accessToken: string,
    offsetIndex: number
) {
    return spotifyApi.put(
        `me/player/play?device_id=${deviceId}`,
        {
            uris,
            offset: { position: offsetIndex },
        },
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );
}
