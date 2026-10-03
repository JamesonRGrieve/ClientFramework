// SPDX-License-Identifier: AGPL-3.0-or-later
import { deleteCookie, setCookie } from 'cookies-next/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, configureApiClient, getApiClient } from './client';
import { ApiError } from './errors';

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_TOO_MANY = 429;

const answering = (response: Response): ReturnType<typeof vi.fn<typeof fetch>> =>
  vi.fn<typeof fetch>(async () => Promise.resolve(response));

const json = (body: object, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    status: HTTP_OK,
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

const sent = (fetchImpl: ReturnType<typeof vi.fn<typeof fetch>>): { url: string; init: RequestInit } => {
  const [url, init] = fetchImpl.mock.calls[0] ?? ['', {}];
  return { url: url instanceof Request ? url.url : String(url), init: init ?? {} };
};

describe('ApiClient', () => {
  afterEach(() => {
    deleteCookie('zx_csrf');
  });

  it('rides the session cookie on the app’s origin, with the CSRF token on writes only', async () => {
    setCookie('zx_csrf', 'csrf-1');
    const fetchImpl = answering(json({ team: { id: 't1' } }));
    const client = new ApiClient({ baseUrl: '/api/', fetchImpl });
    const response = await client.create('team', { team: { name: 'Alpha' } });
    expect(response.data).toEqual({ team: { id: 't1' } });
    const { url, init } = sent(fetchImpl);
    expect(url).toBe('/api/v1/team');
    expect(init.credentials).toBe('same-origin');
    const headers = new Headers(init.headers);
    expect(headers.get('X-CSRF-Token')).toBe('csrf-1');
    expect(headers.get('Authorization')).toBeNull();

    const reads = answering(json({ teams: [] }));
    await new ApiClient({ fetchImpl: reads }).get('/v1/team', { query: { limit: 5, skip: undefined } });
    expect(sent(reads).url).toBe('/v1/team?limit=5');
    expect(new Headers(sent(reads).init.headers).get('X-CSRF-Token')).toBeNull();
  });

  it('sends an API key instead where there is no browser session', async () => {
    const fetchImpl = answering(new Response(null, { status: HTTP_NO_CONTENT }));
    const client = new ApiClient({
      baseUrl: 'https://api.example.com',
      authHeader: (): string => 'Bearer key-1',
      fetchImpl,
    });
    await expect(client.read('team', 't/1')).resolves.toMatchObject({ data: undefined, status: HTTP_NO_CONTENT });
    expect(sent(fetchImpl).url).toBe('https://api.example.com/v1/team/t%2F1');
    expect(new Headers(sent(fetchImpl).init.headers).get('Authorization')).toBe('Bearer key-1');
  });

  it('reports rate limits and raises the server’s error', async () => {
    const onRateLimit = vi.fn();
    const fetchImpl = answering(
      json({ detail: 'Too many requests' }, { status: HTTP_TOO_MANY, headers: { 'Retry-After': '3' } }),
    );
    const failure = new ApiClient({ fetchImpl, onRateLimit }).get('/v1/team');
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({ status: HTTP_TOO_MANY, detail: 'Too many requests' });
    expect(onRateLimit).toHaveBeenCalled();
  });
});

describe('configureApiClient', () => {
  it('keeps options set before, so a listener added later keeps the app’s base URL', async () => {
    const fetchImpl = answering(json({}));
    configureApiClient({ baseUrl: '/api', fetchImpl });
    configureApiClient({ onDeprecation: vi.fn() });
    await getApiClient().get('/v1/user');
    expect(sent(fetchImpl).url).toBe('/api/v1/user');
  });
});
