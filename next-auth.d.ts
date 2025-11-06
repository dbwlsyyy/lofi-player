// next-auth.d.ts
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: DefaultSession['user'];
        /** 우리가 콜백에서 주입할 액세스 토큰 */
        accessToken?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
    }
}

// 파일을 모듈로 인식시키기 위한 빈 export (보강 파일에서 종종 필요)
export {};
