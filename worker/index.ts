/**
 * Cloudflare Worker entry point (`main` in wrangler.jsonc).
 *
 * Workers static assets serve the Next.js export in `out/`. Only `/api/*`
 * requests reach this Worker (`run_worker_first` in wrangler.jsonc). The
 * Worker answers `/api/image-proxy` and hands every other path back to the
 * asset binding, which returns the exported 404 page for unknown paths.
 */
import { proxyImage } from '../src/lib/image-proxy';

const IMAGE_PROXY_PATH = '/api/image-proxy';
const CACHE_NAME = 'image-proxy';

async function handleImageProxy(request: Request, context: ExecutionContext): Promise<Response> {
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
    context.waitUntil(cache.put(request, response.clone()));
  }
  return response;
}

// `Env` and `ExecutionContext` come from worker-configuration.d.ts, which
// `npm run cf-typegen` generates from wrangler.jsonc.
const worker = {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === IMAGE_PROXY_PATH) {
      return handleImageProxy(request, context);
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
