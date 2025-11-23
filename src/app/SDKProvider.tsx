'use client';

import { useSession } from 'next-auth/react';
import { useSpotifySDK } from '@/hooks/useSpotifySDK';

export default function SDKProvider() {
    const { data: session } = useSession();

    const accessToken =
        session && typeof session === 'object' ? session.accessToken : null;

    useSpotifySDK(accessToken);

    return null;
}
