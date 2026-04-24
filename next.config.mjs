/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.spotifycdn.com", // 모든 spotifycdn 서브도메인 허용 (fa, ak 등)
      },
      {
        protocol: "https",
        hostname: "*.scdn.co", // 일반 앨범/아티스트 이미지, 플레이리스트 모자이크 이미지
      },
    ],
  },
};

export default nextConfig;
