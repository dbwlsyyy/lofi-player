import axios from 'axios';

const BASE_URL = 'https://api.spotify.com/v1';

export function spotifyClient(accessToken) {
    return axios.create({
        baseURL: BASE_URL,
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

export async function fetchMe(accessToken) {
    const api = spotifyClient(accessToken);
    const { data } = await api.get('/me');
    return data; // display_name, email 등 포함
}

export async function fetchPlaylists(accessToken) {
    const res = await fetch(`${BASE_URL}/me/playlists`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!res.ok) {
        throw new Error('플레이리스트 불러오기 실패');
    }
    const data = await res.json();
    return data.items; // 배열만 반환
}
