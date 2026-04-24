/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.spotifycdn.com", // 👈 모든 spotifycdn 서브도메인 허용 (fa, ak 등)
      },
      {
        protocol: "https",
        hostname: "*.scdn.co", // 👈 i.scdn.co, mosaic.scdn.co 등 모두 허용
      },
    ],
  },
};

export default nextConfig;
