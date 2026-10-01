// SPDX-License-Identifier: AGPL-3.0-or-later
import { deleteCookie, setCookie } from 'cookies-next/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, parseRetryAfter, RateLimitError, ZephyrexClient } from './client';

const BASE = 'https://api.example.com';
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;
const HTTP_TOO_MANY = 429;
const RETRY_AFTER_SECONDS = 2;
const MS = 1000;

const client = (baseUrl = `${BASE}/`): ZephyrexClient => new ZephyrexClient({ baseUrl });

const reply = (...responses: Response[]): ReturnType<typeof vi.fn<typeof fetch>> => {
  const fetchMock = vi.fn<typeof fetch>();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('ZephyrexClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    deleteCookie('zx_csrf');
  });

  it('reads on the session cookie with query params, never a token, and returns the JSON body', async () => {
    setCookie('zx_csrf', 'csrf-1');
    const fetchMock = reply(new Response('{"user":{"id":"u1"}}', { status: HTTP_OK }));
    await expect(client().get('/v1/user', { include: 'teams' })).resolves.toEqual({ user: { id: 'u1' } });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/v1/user?include=teams`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('sends the CSRF token on writes', async () => {
    setCookie('zx_csrf', 'csrf-1');
    const fetchMock = reply(new Response('{}', { status: HTTP_OK }));
    await client().post('/v1/team', { team: { name: 'Alpha' } });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/v1/team`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf-1' },
      body: '{"team":{"name":"Alpha"}}',
    });
  });

  it('works against a same-origin base', async () => {
    const fetchMock = reply(new Response('{}', { status: HTTP_OK }), new Response('{}', { status: HTTP_OK }));
    await client('/api').get('/v1/team', { limit: '5' });
    await client('').get('/v1/team');
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/v1/team?limit=5', '/v1/team']);
  });

  it('gives the address of a path on the API, for links as well as requests', () => {
    expect(client().url('/v1/sdk/python/download')).toBe(`${BASE}/v1/sdk/python/download`);
    expect(client('/api').url('/v1/provider/root/status', { extension: 'secret_vault', health: 'true' })).toBe(
      '/api/v1/provider/root/status?extension=secret_vault&health=true',
    );
    expect(client('').url('/v1/sdk', {})).toBe('/v1/sdk');
  });

  it('answers a bodiless 204 with null instead of failing to parse it', async () => {
    reply(new Response(null, { status: HTTP_NO_CONTENT }));
    await expect(client().delete('/v1/provider/instance/i1')).resolves.toBeNull();
  });

  it('raises ApiError with the status and body on failure', async () => {
    reply(new Response('{"detail":"Not found"}', { status: HTTP_NOT_FOUND }));
    await expect(client().get('/v1/team/missing')).rejects.toEqual(new ApiError(HTTP_NOT_FOUND, '{"detail":"Not found"}'));
  });

  describe('on 429', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(Math, 'random').mockReturnValue(0);
    });

    it('waits Retry-After, then retries', async () => {
      const fetchMock = reply(
        new Response('slow down', { status: HTTP_TOO_MANY, headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) } }),
        new Response('{"ok":true}', { status: HTTP_OK }),
      );
      const pending = client().get('/v1/team');
      await vi.advanceTimersByTimeAsync(RETRY_AFTER_SECONDS * MS);
      await expect(pending).resolves.toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('gives up with RateLimitError after the last retry', async () => {
      const limited = (): Response => new Response('slow down', { status: HTTP_TOO_MANY, headers: { 'Retry-After': '1' } });
      const fetchMock = reply(limited(), limited(), limited(), limited());
      const failure = client()
        .get('/v1/team')
        .catch((error: Error) => error);
      await vi.runAllTimersAsync();
      await expect(failure).resolves.toEqual(new RateLimitError(MS, 'slow down'));
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });
});

describe('parseRetryAfter', () => {
  it('reads delta-seconds, an HTTP date, or falls back to one second', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T12:00:00Z'));
    const withHeader = (value: string | null): Response =>
      new Response(null, value === null ? {} : { headers: { 'Retry-After': value } });
    expect(parseRetryAfter(withHeader('3'))).toBe(3 * MS);
    expect(parseRetryAfter(withHeader('Tue, 29 Sep 2026 12:00:05 GMT'))).toBe(5 * MS);
    expect(parseRetryAfter(withHeader(null))).toBe(MS);
    expect(parseRetryAfter(withHeader('soon'))).toBe(MS);
    vi.useRealTimers();
  });
});
