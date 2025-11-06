// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth/next';
import Spotify from 'next-auth/providers/spotify';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

const handler = NextAuth({
    providers: [
        Spotify({
            clientId: process.env.SPOTIFY_CLIENT_ID ?? '',
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? '',
            authorization: {
                params: { scope: process.env.SPOTIFY_SCOPE ?? '' },
            },
        }),
    ],

    session: { strategy: 'jwt' },

    callbacks: {
        async jwt({
            token,
            account,
        }: {
            token: JWT;
            account?: Record<string, unknown> | null;
        }) {
            if (account && (account as any).access_token) {
                (token as any).accessToken = (account as any)
                    .access_token as string;
            }
            return token;
        },

        async session({ session, token }: { session: Session; token: JWT }) {
            (session as any).accessToken = (token as any).accessToken;
            return session;
        },
    },

    debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
