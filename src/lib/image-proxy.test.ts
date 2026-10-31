/**
 * @jest-environment node
 */
import { isAllowedImageUrl, proxyImage } from './image-proxy';

const PROXY_URL = 'https://meme.example/api/image-proxy';

function buildProxyUrl(imageUrl: string) {
  return `${PROXY_URL}?url=${encodeURIComponent(imageUrl)}`;
}

function createImageResponse(url: string, responseInit: ResponseInit = {}) {
  const response = new Response(new Uint8Array([1, 2, 3]), {
    headers: { 'Content-Type': 'image/png' },
    ...responseInit,
  });
  Object.defineProperty(response, 'url', { value: url });
  return response;
}

describe('isAllowedImageUrl', () => {
  it.each([
    'https://i.imgflip.com/30b1gx.jpg',
    'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif',
    'https://i.giphy.com/media/abc/giphy.gif',
  ])('allows %s', (url) => {
    expect(isAllowedImageUrl(url)).toBe(true);
  });

  it.each([
    'http://i.imgflip.com/30b1gx.jpg',
    'https://example.com/image.png',
    'https://giphy.com.evil.example/image.gif',
    'https://evilgiphy.com/image.gif',
    'http://169.254.169.254/latest/meta-data/',
    'not a url',
  ])('rejects %s', (url) => {
    expect(isAllowedImageUrl(url)).toBe(false);
  });
});

describe('proxyImage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when the url parameter is missing', async () => {
    const response = await proxyImage(PROXY_URL, jest.fn());
    expect(response.status).toBe(400);
  });

  it('returns 403 without fetching when the host is not allowed', async () => {
    const fetchImpl = jest.fn();
    const response = await proxyImage(buildProxyUrl('https://example.com/a.png'), fetchImpl);
    expect(response.status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns the image with its content type and a long cache lifetime', async () => {
    const imageUrl = 'https://i.imgflip.com/30b1gx.jpg';
    const fetchImpl = jest.fn().mockResolvedValue(createImageResponse(imageUrl));
    const response = await proxyImage(buildProxyUrl(imageUrl), fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(imageUrl);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('rejects responses redirected to a host that is not allowed', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(createImageResponse('https://example.com/a.png'));
    const response = await proxyImage(buildProxyUrl('https://i.imgflip.com/a.png'), fetchImpl);
    expect(response.status).toBe(403);
  });

  it('passes through upstream error statuses', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      createImageResponse('https://i.imgflip.com/missing.png', { status: 404, statusText: 'Not Found' }),
    );
    const response = await proxyImage(buildProxyUrl('https://i.imgflip.com/missing.png'), fetchImpl);
    expect(response.status).toBe(404);
  });

  it('returns 500 when the fetch throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = jest.fn().mockRejectedValue(new Error('network down'));
    const response = await proxyImage(buildProxyUrl('https://i.imgflip.com/a.png'), fetchImpl);
    expect(response.status).toBe(500);
  });

  it.each(['text/html', 'image/svg+xml', 'IMAGE/SVG+XML; charset=utf-8'])(
    'returns 502 when the upstream content type is %s',
    async (contentType) => {
      const imageUrl = 'https://i.imgflip.com/a.png';
      const fetchImpl = jest.fn().mockResolvedValue(
        createImageResponse(imageUrl, { headers: { 'Content-Type': contentType } }),
      );
      const response = await proxyImage(buildProxyUrl(imageUrl), fetchImpl);
      expect(response.status).toBe(502);
    },
  );

  it('returns 502 when the upstream sends no content type', async () => {
    const imageUrl = 'https://i.imgflip.com/a.png';
    const upstreamResponse = createImageResponse(imageUrl);
    upstreamResponse.headers.delete('Content-Type');
    const response = await proxyImage(buildProxyUrl(imageUrl), jest.fn().mockResolvedValue(upstreamResponse));
    expect(response.status).toBe(502);
  });

  it('marks the proxied image as nosniff', async () => {
    const imageUrl = 'https://i.imgflip.com/a.png';
    const fetchImpl = jest.fn().mockResolvedValue(createImageResponse(imageUrl));
    const response = await proxyImage(buildProxyUrl(imageUrl), fetchImpl);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
