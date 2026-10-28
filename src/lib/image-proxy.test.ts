/**
 * @jest-environment node
 */
import { isAllowedImageUrl, proxyImage } from './image-proxy';

const PROXY_URL = 'https://meme.example/api/image-proxy';

function proxyUrlFor(imageUrl: string) {
  return `${PROXY_URL}?url=${encodeURIComponent(imageUrl)}`;
}

function imageResponse(url: string, init: ResponseInit = {}) {
  const response = new Response(new Uint8Array([1, 2, 3]), {
    headers: { 'Content-Type': 'image/png' },
    ...init,
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
  it('returns 400 when the url parameter is missing', async () => {
    const response = await proxyImage(PROXY_URL, jest.fn());
    expect(response.status).toBe(400);
  });

  it('returns 403 without fetching when the host is not allowed', async () => {
    const fetchImpl = jest.fn();
    const response = await proxyImage(proxyUrlFor('https://example.com/a.png'), fetchImpl);
    expect(response.status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns the image with its content type and a long cache lifetime', async () => {
    const imageUrl = 'https://i.imgflip.com/30b1gx.jpg';
    const fetchImpl = jest.fn().mockResolvedValue(imageResponse(imageUrl));
    const response = await proxyImage(proxyUrlFor(imageUrl), fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(imageUrl);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('rejects responses redirected to a host that is not allowed', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(imageResponse('https://example.com/a.png'));
    const response = await proxyImage(proxyUrlFor('https://i.imgflip.com/a.png'), fetchImpl);
    expect(response.status).toBe(403);
  });

  it('passes through upstream error statuses', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      imageResponse('https://i.imgflip.com/missing.png', { status: 404, statusText: 'Not Found' }),
    );
    const response = await proxyImage(proxyUrlFor('https://i.imgflip.com/missing.png'), fetchImpl);
    expect(response.status).toBe(404);
  });

  it('returns 500 when the fetch throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = jest.fn().mockRejectedValue(new Error('network down'));
    const response = await proxyImage(proxyUrlFor('https://i.imgflip.com/a.png'), fetchImpl);
    expect(response.status).toBe(500);
  });
});
