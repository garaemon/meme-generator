/**
 * @jest-environment node
 */
import worker from './index';
import { proxyImage } from '../src/lib/image-proxy';

jest.mock('../src/lib/image-proxy');
const proxyImageMock = jest.mocked(proxyImage);

const PROXY_REQUEST_URL = 'https://meme.example/api/image-proxy?url=x';

function createFakeCache(cachedResponse?: Response) {
  return {
    match: jest.fn().mockResolvedValue(cachedResponse),
    put: jest.fn().mockResolvedValue(undefined),
  };
}

function installFakeCaches(cache: ReturnType<typeof createFakeCache>) {
  Object.defineProperty(globalThis, 'caches', {
    value: { open: jest.fn().mockResolvedValue(cache) },
    configurable: true,
  });
}

function createEnv() {
  const fetchAsset = jest.fn().mockResolvedValue(new Response('asset'));
  return { env: { ASSETS: { fetch: fetchAsset } } as unknown as Env, fetchAsset };
}

function createContext() {
  const waitUntil = jest.fn();
  return { context: { waitUntil } as unknown as ExecutionContext, waitUntil };
}

describe('worker.fetch', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should_forward_unknown_api_paths_to_static_assets', async () => {
    const { env, fetchAsset } = createEnv();
    const request = new Request('https://meme.example/api/unknown');
    await worker.fetch(request, env, createContext().context);
    expect(fetchAsset).toHaveBeenCalledWith(request);
  });

  it('should_return_405_for_non_get_requests', async () => {
    const request = new Request(PROXY_REQUEST_URL, { method: 'POST' });
    const response = await worker.fetch(request, createEnv().env, createContext().context);
    expect(response.status).toBe(405);
  });

  it('should_serve_cached_response_without_calling_proxy', async () => {
    installFakeCaches(createFakeCache(new Response('cached')));
    await worker.fetch(new Request(PROXY_REQUEST_URL), createEnv().env, createContext().context);
    expect(proxyImageMock).not.toHaveBeenCalled();
  });

  it('should_return_the_cached_body_on_cache_hit', async () => {
    installFakeCaches(createFakeCache(new Response('cached')));
    const response = await worker.fetch(new Request(PROXY_REQUEST_URL), createEnv().env, createContext().context);
    expect(await response.text()).toBe('cached');
  });

  it('should_write_successful_responses_to_cache_in_the_background', async () => {
    const cache = createFakeCache();
    installFakeCaches(cache);
    proxyImageMock.mockResolvedValue(new Response('image', { status: 200 }));
    const { context, waitUntil } = createContext();
    await worker.fetch(new Request(PROXY_REQUEST_URL), createEnv().env, context);
    expect(waitUntil).toHaveBeenCalledWith(cache.put.mock.results[0].value);
  });

  it('should_not_cache_error_responses', async () => {
    const cache = createFakeCache();
    installFakeCaches(cache);
    proxyImageMock.mockResolvedValue(new Response('nope', { status: 403 }));
    await worker.fetch(new Request(PROXY_REQUEST_URL), createEnv().env, createContext().context);
    expect(cache.put).not.toHaveBeenCalled();
  });
});
