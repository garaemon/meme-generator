import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    // Production builds are a static export served by Cloudflare Workers
    // (see wrangler.jsonc and worker/index.ts).
    output: isDevServer ? undefined : 'export',
    // `*.dev.ts` files (the image proxy route) only exist under `next dev`,
    // because a static export cannot contain route handlers.
    pageExtensions: isDevServer ? ['tsx', 'ts', 'dev.ts'] : ['tsx', 'ts'],
    images: {
      // The static export has no image optimization server.
      unoptimized: true,
    },
  };
};

export default nextConfig;
