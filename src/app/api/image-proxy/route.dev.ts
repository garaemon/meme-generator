import { proxyImage } from '@/lib/image-proxy';

// Only used by `next dev` (see pageExtensions in next.config.ts). In production
// the static export is served by Cloudflare Workers and worker/index.ts handles
// this path.
export async function GET(request: Request) {
  return proxyImage(request.url);
}
