import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';

const handler = NextAuth({
    providers: [
        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            authorization: { params: { scope: process.env.SPOTIFY_SCOPE } },
        }),
    ],
    session: { strategy: 'jwt' },
});

export { handler as GET, handler as POST };
