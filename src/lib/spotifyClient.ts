import axios from 'axios';

const BASE_URL = 'https://api.spotify.com/v1';

export function createSpotifyClient(accessToken: string) {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
}
