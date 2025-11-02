import axios from 'axios';

export function spotifyClient(accessToken) {
    return axios.create({
        baseURL: 'https://api.spotify.com/v1',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

export async function fetchMe(accessToken) {
    const api = spotifyClient(accessToken);
    const { data } = await api.get('/me');
    return data; // display_name, email 등 포함
}
