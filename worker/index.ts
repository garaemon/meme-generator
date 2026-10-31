/**
 * Cloudflare Worker entry point (`main` in wrangler.jsonc).
 *
 * Workers static assets serve the Next.js export in `out/`. Only `/api/*`
 * requests reach this Worker (`run_worker_first` in wrangler.jsonc). The
 * Worker answers `/api/image-proxy` and hands every other path back to the
 * asset binding, which returns the exported 404 page for unknown paths.
 */
import { proxyImage } from '../src/lib/image-proxy';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const IMAGE_PROXY_PATH = '/api/image-proxy';
const CACHE_NAME = 'image-proxy';

async function handleImageProxy(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
  }

  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await proxyImage(request.url);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === IMAGE_PROXY_PATH) {
      return handleImageProxy(request);
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
