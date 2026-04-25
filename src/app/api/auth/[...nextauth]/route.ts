import NextAuth from "next-auth/next";
import Spotify from "next-auth/providers/spotify";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not defined");
}

async function refreshAccessToken(token: any) {
  try {
    const url = "https://accounts.spotify.com/api/token";
    const basicAuth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
    ).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("RefreshAccessTokenError", error);
    return {
      ...token,
      error: "RefreshAccessTokenError", // 갱신 완전 실패 (인터셉터 실행)
    };
  }
}

const handler = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
      authorization: {
        params: { scope: process.env.SPOTIFY_SCOPE ?? "" },
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, account }) {
      // 초기 로그인 시: 모든 토큰과 만료 시간(초 단위 -> 밀리초 변환)을 넣어줌
      if (account && account.access_token) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          // account.expires_at은 '초' 단위이므로 곱하기 1000
          accessTokenExpires: (account.expires_at as number) * 1000,
        };
      }

      // 이후 요청 시: 아직 만료 시간이 안 지났다면 기존 토큰을 그냥 패스
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // 만료 시간이 지났다면 유저 몰래 새 토큰 받아옴 (사일런트 리프레시)
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      // 컴포넌트(useSession)에서 쓸 수 있도록 session 객체에 값을 넣어줌
      if (token) {
        session.accessToken = token.accessToken as string;
        session.error = token.error as string; // 에러 상태도 프론트엔드로 넘겨줍니다.
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
