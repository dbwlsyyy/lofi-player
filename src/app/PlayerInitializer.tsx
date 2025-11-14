'use client';

import { useSession } from 'next-auth/react';
import { useSpotifyWebPlayback } from '@/hooks/useSpotifyWebPlayback';

export default function PlayerInitializer() {
    const { data: session } = useSession();

    const accessToken =
        session && typeof session === 'object' ? session.accessToken : null;

    useSpotifyWebPlayback(accessToken);

    return null;
}
