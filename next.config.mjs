/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.spotifycdn.com" },
      { protocol: "https", hostname: "*.scdn.co" },
    ],
  },
};

export default nextConfig;
