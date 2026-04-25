export declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"];
    accessToken?: string;
    error?: string;
  }
}

export declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
