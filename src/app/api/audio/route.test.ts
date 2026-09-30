// SPDX-License-Identifier: AGPL-3.0-or-later
import { NextRequest } from 'next/server.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;

const request = (session?: string): NextRequest => {
  const req = new NextRequest('https://app.example.com/api/audio');
  if (session !== undefined) {
    req.cookies.set('zx_session', session);
  }
  return req;
};

describe('GET /api/audio', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refuses a request without a session, without asking the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect((await GET(request())).status).toBe(HTTP_UNAUTHORIZED);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a session the API does not accept, or cannot check', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response(null, { status: HTTP_UNAUTHORIZED }))),
    );
    expect((await GET(request('stale'))).status).toBe(HTTP_UNAUTHORIZED);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('fetch failed'))),
    );
    expect((await GET(request('sess-1'))).status).toBe(HTTP_UNAUTHORIZED);
  });

  it('checks the session against the API, then serves the request', async () => {
    const fetchMock = vi.fn(async () => Promise.resolve(new Response(null, { status: HTTP_OK })));
    vi.stubGlobal('fetch', fetchMock);
    // No `url` to fetch: past the session check, the request itself is incomplete.
    expect((await GET(request('sess-1'))).status).toBe(HTTP_BAD_REQUEST);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/user$/),
      expect.objectContaining({ headers: { Cookie: 'zx_session=sess-1' } }),
    );
  });
});
