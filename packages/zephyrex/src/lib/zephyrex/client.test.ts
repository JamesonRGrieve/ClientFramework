// SPDX-License-Identifier: AGPL-3.0-or-later
import { deleteCookie, setCookie } from 'cookies-next/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, LIST_PAGE_SIZE, parseRetryAfter, RateLimitError, ZephyrexClient } from './client';

const BASE = 'https://api.example.com';
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;
const HTTP_TOO_MANY = 429;
const HTTP_SERVER_ERROR = 500;
const HTTP_BAD_GATEWAY = 502;
const NOT_FOUND_BODY = '{"detail":"Not found"}';
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
    reply(new Response(NOT_FOUND_BODY, { status: HTTP_NOT_FOUND }));
    await expect(client().get('/v1/team/missing')).rejects.toEqual(new ApiError(HTTP_NOT_FOUND, NOT_FOUND_BODY));
  });

  describe('list', () => {
    const page = (rows: { id: string }[], hasMore?: boolean): Response =>
      new Response(JSON.stringify({ keys: rows, ...(hasMore === undefined ? {} : { pagination: { has_more: hasMore } }) }), {
        status: HTTP_OK,
      });
    const Row = z.object({ id: z.string() });
    const ROUTE = '/v1/key';

    it('walks the pages in order until the server says there are no more', async () => {
      const fetchMock = reply(page([{ id: 'a' }], true), page([{ id: 'b' }], false));
      await expect(client().list(ROUTE, 'keys', Row, { team_id: 't1' })).resolves.toEqual([{ id: 'a' }, { id: 'b' }]);
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        `${BASE}${ROUTE}?team_id=t1&offset=0&limit=${LIST_PAGE_SIZE}`,
        `${BASE}${ROUTE}?team_id=t1&offset=${LIST_PAGE_SIZE}&limit=${LIST_PAGE_SIZE}`,
      ]);
    });

    it('stops at an unpaginated answer or an empty page', async () => {
      reply(page([{ id: 'a' }]));
      await expect(client().list(ROUTE, 'keys', Row)).resolves.toEqual([{ id: 'a' }]);
      const fetchMock = reply(page([], true));
      await expect(client().list(ROUTE, 'keys', Row)).resolves.toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rejects rows that do not match the schema', async () => {
      reply(page([{ id: 'a' }]));
      await expect(client().list(ROUTE, 'keys', z.object({ name: z.string() }))).rejects.toThrow(z.ZodError);
    });
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

describe('ApiError', () => {
  it("reads the server's message and the rules a refused value broke", () => {
    const refused = new ApiError(
      HTTP_UNPROCESSABLE,
      '{"detail":{"message":"Password does not meet the policy","failed":["min_length","require_digit"]}}',
    );
    expect(refused.message).toBe('Password does not meet the policy');
    expect(refused.detail).toBe(refused.message);
    expect(refused.failed).toEqual(['min_length', 'require_digit']);
    expect(new ApiError(HTTP_NOT_FOUND, NOT_FOUND_BODY)).toMatchObject({
      message: 'Not found',
      status: HTTP_NOT_FOUND,
      body: NOT_FOUND_BODY,
      failed: [],
    });
  });

  it('falls back to the body when it is not the error shape, or the status when there is none', () => {
    expect(new ApiError(HTTP_BAD_GATEWAY, 'Bad Gateway')).toMatchObject({ message: 'Bad Gateway', failed: [] });
    expect(new ApiError(HTTP_SERVER_ERROR, '{"error":"boom"}')).toMatchObject({ message: '{"error":"boom"}' });
    expect(new ApiError(HTTP_SERVER_ERROR, '').message).toBe(`HTTP ${HTTP_SERVER_ERROR}`);
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
