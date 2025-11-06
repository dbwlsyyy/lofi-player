import axios from 'axios';

const BASE_URL = 'https://api.spotify.com/v1';

export function spotifyClient(accessToken: string) {
    return axios.create({
        baseURL: BASE_URL,
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

export async function fetchMe(accessToken: string): Promise<SpotifyUser> {
    try {
        const api = spotifyClient(accessToken);
        const { data } = await api.get<SpotifyUser>('/me');
        return data;
    } catch (e: any) {
        console.error('fetchMe API Error:', e.response?.status, e.message);
        throw e; // 다시 던짐 (호출부에서 처리)
    }
}

export async function fetchPlaylists(
    accessToken: string
): Promise<SpotifyPlaylistItem[]> {
    try {
        const api = spotifyClient(accessToken);
        const { data } =
            await api.get<SpotifyPlaylistResponse>('/me/playlists');
        return data.items;
    } catch (e: any) {
        console.error(
            'fetchPlaylist API error:',
            e.response?.status,
            e.message
        );
        throw e;
    }
}

export interface SpotifyUser {
    display_name: string;
    email: string;
    id: string;
    images: { url: string }[];
}

export interface SpotifyPlaylistItem {
    id: string;
    name: string;
    images: { url: string }[];
    tracks: { total: number };
    // owner?: { display_name: string };
}

export interface SpotifyPlaylistResponse {
    items: SpotifyPlaylistItem[];
}
