/**
 * Server-side proxy for template images, shared by the Cloudflare Worker
 * (worker/index.ts) and the `next dev` route (src/app/api/image-proxy/route.dev.ts).
 * Browsers taint a canvas that draws cross-origin images, so the app loads
 * imgflip and giphy templates through this same-origin endpoint instead.
 */

// Anything outside these hosts is rejected so the proxy cannot reach arbitrary
// URLs. giphy serves media from several subdomains (media.giphy.com,
// i.giphy.com, media0.giphy.com, ...), hence the suffix match.
const ALLOWED_HOSTS = ['i.imgflip.com'];
const ALLOWED_HOST_SUFFIXES = ['.giphy.com'];

/** Returns true when `rawUrl` is an https URL on one of the allowed hosts. */
export function isAllowedImageUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') {
    return false;
  }
  const hostname = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.includes(hostname) ||
    ALLOWED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

/**
 * Fetches the image named by the `url` query parameter of `requestUrl`.
 *
 * Responds with 400 when the parameter is missing, 403 when the URL (or the
 * URL a redirect ended on) is not an allowed host, the upstream status when the
 * upstream fails, and 500 when the fetch itself throws.
 */
export async function proxyImage(requestUrl: string, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const imageUrl = new URL(requestUrl).searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing URL parameter', { status: 400 });
  }
  if (!isAllowedImageUrl(imageUrl)) {
    return new Response('URL is not allowed', { status: 403 });
  }

  try {
    const response = await fetchImpl(imageUrl);

    if (!response.ok) {
      return new Response(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }
    // Redirects are followed, so check where we actually ended up.
    if (response.url && !isAllowedImageUrl(response.url)) {
      return new Response('Redirected to a URL that is not allowed', { status: 403 });
    }

    const headers = new Headers();
    // Copy content-type from original response or default to image/jpeg
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(await response.arrayBuffer(), {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
