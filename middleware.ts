export { default } from 'next-auth/middleware';

export const config = {
    matcher: ['/home/:path*'], // /home 이하 경로는 로그인 필수
};
