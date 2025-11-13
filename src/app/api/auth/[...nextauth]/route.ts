import NextAuth from 'next-auth/next';
import Spotify from 'next-auth/providers/spotify';

if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET is not defined');
}

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
        async jwt({ token, account }) {
            if (account?.access_token) {
                token.accessToken = account.access_token as string;
            }
            return token;
        },

        async session({ session, token }) {
            if (token?.accessToken) {
                session.accessToken = token.accessToken;
            }
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,

    debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
