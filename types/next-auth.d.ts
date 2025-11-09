export declare module 'next-auth' {
    interface Session {
        user?: DefaultSession['user'];
        accessToken?: string;
    }
}

export declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
    }
}
