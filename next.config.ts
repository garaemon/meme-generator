import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgflip.com',
      },
    ],
    localPatterns: [
      {
        pathname: '/api/image-proxy',
        search: '?url=*',
      },
    ],
  },
};

export default nextConfig;
