// SPDX-License-Identifier: AGPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiBaseFor, createMiddleware } from './createMiddleware';
import type { MiddlewareHook } from './types';

const ORIGIN = 'https://app.example.com';
const HTTP_OK = 200;
const API_ORIGIN = 'https://api.example.com';
/** The header Next sets on a response that lets the request continue. */
const CONTINUES = 'x-middleware-next';
const UPSTREAM_REQUIRED = 'upstreamUrl is required';

const request = (path = '/team/1', session?: string): NextRequest => {
  const req = new NextRequest(`${ORIGIN}${path}`);
  if (session !== undefined) {
    req.cookies.set('zx_session', session);
  }
  return req;
};

const recording =
  (log: string[], name: string, activated = false): MiddlewareHook =>
  async () => {
    log.push(name);
    return Promise.resolve({ activated, response: NextResponse.redirect(`${ORIGIN}/elsewhere`) });
  };

const CONFIG = { server: { baseUrl: '/api' } };

describe('createMiddleware', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs built-in, app, then extension hooks in order and continues when none activates', async () => {
    const log: string[] = [];
    const middleware = createMiddleware(
      { ...CONFIG, extensions: [{ name: 'ext', middleware: [recording(log, 'extension')] }] },
      { builtinHooks: [recording(log, 'builtin')], hooks: [recording(log, 'app')] },
    );
    const response = await middleware(request());
    expect(log).toEqual(['builtin', 'app', 'extension']);
    expect(response.headers.get(CONTINUES)).toBe('1');
    expect(response.headers.get('x-next-pathname')).toBe('/team/1');
  });

  it('answers with the first activating hook and skips the rest', async () => {
    const log: string[] = [];
    const middleware = createMiddleware(
      { ...CONFIG, extensions: [{ name: 'ext', middleware: [recording(log, 'never')] }] },
      { builtinHooks: [], hooks: [recording(log, 'first', true)] },
    );
    const response = await middleware(request());
    expect(log).toEqual(['first']);
    expect(response.headers.get('location')).toBe(`${ORIGIN}/elsewhere`);
    expect(response.headers.get('x-next-pathname')).toBe('/team/1');
  });

  it('lets a throwing hook fail the request instead of silently skipping auth', async () => {
    const failing: MiddlewareHook = async () => Promise.reject(new Error('boom'));
    const middleware = createMiddleware(CONFIG, { builtinHooks: [failing] });
    await expect(middleware(request())).rejects.toThrow('boom');
  });

  it('sends a fresh-nonce CSP on every response, and hands the nonce on with a continuing request', async () => {
    const middleware = createMiddleware(CONFIG, { builtinHooks: [] });
    const first = await middleware(request());
    const policy = first.headers.get('content-security-policy') ?? '';
    const nonce = first.headers.get('x-middleware-request-x-nonce') ?? '';
    expect(nonce).not.toBe('');
    expect(policy).toContain(`'nonce-${nonce}'`);
    // Next reads the policy from the request to stamp the nonce on its own scripts.
    expect(first.headers.get('x-middleware-request-content-security-policy')).toBe(policy);
    const second = await middleware(request());
    expect(second.headers.get('x-middleware-request-x-nonce')).not.toBe(nonce);
  });

  it('puts the CSP on a hook’s own answer too, and adds the app’s sources', async () => {
    const middleware = createMiddleware(
      { ...CONFIG, contentSecurityPolicy: { 'connect-src': ['https://analytics.example.org'] } },
      { builtinHooks: [recording([], 'redirect', true)] },
    );
    const response = await middleware(request());
    expect(response.headers.get('location')).toBe(`${ORIGIN}/elsewhere`);
    expect(response.headers.get('content-security-policy')).toContain('https://analytics.example.org');
  });

  it('guards nothing, and needs no API, for an app without accounts', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    // No upstreamUrl: an app without accounts may have no API for a session check to reach.
    const middleware = createMiddleware({ server: { baseUrl: '' }, auth: { enabled: false, privateRoutes: ['/team'] } });
    const response = await middleware(request('/team/1', 'sess-1'));
    expect(response.headers.get(CONTINUES)).toBe('1');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('guards the configured private routes by default', async () => {
    const middleware = createMiddleware({
      server: { baseUrl: '/api', upstreamUrl: 'http://server:1996' },
      auth: { privateRoutes: ['/team'] },
    });
    const response = await middleware(request('/team/1'));
    expect(response.headers.get('location')).toBe(`${ORIGIN}/user`);
    expect((await middleware(request('/pricing'))).headers.get(CONTINUES)).toBe('1');
  });

  it('checks a session against the upstream API', async () => {
    const fetchMock = vi.fn(async () => Promise.resolve(new Response(null, { status: HTTP_OK })));
    vi.stubGlobal('fetch', fetchMock);
    const middleware = createMiddleware({
      server: { baseUrl: '/api', upstreamUrl: 'http://server:1996/' },
      auth: { privateRoutes: ['/team'], authPath: '/account' },
    });
    const response = await middleware(request('/team/1', 'sess-1'));
    expect(response.headers.get(CONTINUES)).toBe('1');
    expect(fetchMock).toHaveBeenCalledWith('http://server:1996/v1/user', expect.anything());
  });
});

describe('apiBaseFor', () => {
  it('is the upstream, else an absolute base', () => {
    expect(apiBaseFor({ server: { baseUrl: '/api', upstreamUrl: 'http://server:1996/' } })).toBe('http://server:1996');
    expect(apiBaseFor({ server: { baseUrl: 'https://api.example.com/' } })).toBe(API_ORIGIN);
  });

  it('takes an empty upstream as none', () => {
    expect(apiBaseFor({ server: { baseUrl: API_ORIGIN, upstreamUrl: '' } })).toBe(API_ORIGIN);
    expect(() => apiBaseFor({ server: { baseUrl: '/api', upstreamUrl: ' ' } })).toThrow(UPSTREAM_REQUIRED);
  });

  it('refuses a same-origin base with no upstream rather than trust the request’s host', () => {
    expect(() => apiBaseFor({ server: { baseUrl: '/api' } })).toThrow(UPSTREAM_REQUIRED);
    expect(() => apiBaseFor({ server: { baseUrl: '' } })).toThrow(UPSTREAM_REQUIRED);
    expect(() => createMiddleware({ server: { baseUrl: '' } })).toThrow(UPSTREAM_REQUIRED);
  });
});
