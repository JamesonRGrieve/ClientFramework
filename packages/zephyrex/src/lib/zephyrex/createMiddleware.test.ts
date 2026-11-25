// SPDX-License-Identifier: AGPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiBaseFor, apiProxyFor, createMiddleware } from './createMiddleware';
import { PUBLIC_ENV_COOKIE } from './publicEnv';
import type { MiddlewareHook } from './types';

const ORIGIN = 'https://app.example.com';
const HTTP_OK = 200;
const API_ORIGIN = 'https://api.example.com';
/** The header Next sets on a response that lets the request continue. */
const CONTINUES = 'x-middleware-next';
const UPSTREAM_REQUIRED = 'upstreamUrl is required';
const UPSTREAM = 'http://server:1996';
/** The header Next sets on a continuing request to carry this response's nonce. */
const SENT_NONCE = 'x-middleware-request-x-nonce';
const CSP = 'content-security-policy';
const REGISTER = '/user/register';
const PROD_ORIGIN = 'https://rpg.example.com';

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
    vi.unstubAllEnvs();
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
    const policy = first.headers.get(CSP) ?? '';
    const nonce = first.headers.get(SENT_NONCE) ?? '';
    expect(nonce).not.toBe('');
    expect(policy).toContain(`'nonce-${nonce}'`);
    // Next reads the policy from the request to stamp the nonce on its own scripts.
    expect(first.headers.get('x-middleware-request-content-security-policy')).toBe(policy);
    const second = await middleware(request());
    expect(second.headers.get(SENT_NONCE)).not.toBe(nonce);
  });

  it('puts the CSP on a hook’s own answer too, and adds the app’s sources', async () => {
    const middleware = createMiddleware(
      { ...CONFIG, contentSecurityPolicy: { 'connect-src': ['https://analytics.example.org'] } },
      { builtinHooks: [recording([], 'redirect', true)] },
    );
    const response = await middleware(request());
    expect(response.headers.get('location')).toBe(`${ORIGIN}/elsewhere`);
    expect(response.headers.get(CSP)).toContain('https://analytics.example.org');
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
      server: { baseUrl: '/api', upstreamUrl: UPSTREAM },
      auth: { privateRoutes: ['/team'] },
    });
    const response = await middleware(request('/team/1'));
    expect(response.headers.get('location')).toBe(`${ORIGIN}/user`);
    expect((await middleware(request('/pricing'))).headers.get(CONTINUES)).toBe('1');
  });

  it('guards the extensions’ auth pages that need a session, and only those', async () => {
    const Page = (): null => null;
    const middleware = createMiddleware({
      server: { baseUrl: '/api', upstreamUrl: UPSTREAM },
      extensions: [
        {
          name: 'pairing',
          authPages: [
            { path: '/pair', component: Page },
            { path: '/pair/approve', component: Page, requiresSession: true },
          ],
        },
      ],
    });
    const approve = await middleware(request('/user/pair/approve?token=t1'));
    expect(approve.headers.get('location')).toBe(`${ORIGIN}/user`);
    expect((await middleware(request('/user/pair'))).headers.get(CONTINUES)).toBe('1');
  });

  it('turns the sign-up page away while sign-up is closed: not found, or to the app’s target', async () => {
    const log: string[] = [];
    const closedWith = (disabledPath?: string): ReturnType<typeof createMiddleware> =>
      createMiddleware(CONFIG, {
        builtinHooks: [recording(log, 'builtin')],
        signupGate: { mode: 'closed', disabledPath },
      });
    const notFound = await closedWith()(request(REGISTER));
    expect(notFound.headers.get('x-middleware-rewrite')).toBe(`${ORIGIN}/_not-found`);
    // The not-found page still gets this response's nonce for its scripts.
    expect(notFound.headers.get(SENT_NONCE)).not.toBeNull();
    expect(notFound.headers.get(CSP)).not.toBeNull();
    const waitlist = await closedWith('/waitlist')(request(REGISTER));
    expect(waitlist.headers.get('location')).toBe(`${ORIGIN}/waitlist`);
    expect(log).toEqual([]);
    // Signing in is never turned away.
    expect((await closedWith('/waitlist')(request('/user/login'))).headers.get(CONTINUES)).toBe('1');
    expect(log).toEqual(['builtin']);
  });

  it('leaves the sign-up page alone while sign-up is open, and in an app without accounts', async () => {
    const open = createMiddleware(CONFIG, { builtinHooks: [], signupGate: { mode: 'open', disabledPath: '/waitlist' } });
    expect((await open(request(REGISTER))).headers.get(CONTINUES)).toBe('1');
    const noAccounts = createMiddleware(
      { server: { baseUrl: '' }, auth: { enabled: false } },
      { signupGate: { mode: 'closed', disabledPath: '/waitlist' } },
    );
    expect((await noAccounts(request(REGISTER))).headers.get(CONTINUES)).toBe('1');
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

describe('createMiddleware, one build for every instance', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const NO_HOOKS = { builtinHooks: [] };
  const served = async (appUri: string): Promise<Record<string, string>> => {
    vi.stubEnv('APP_URI', appUri);
    const response = await createMiddleware(CONFIG, NO_HOOKS)(request());
    return JSON.parse(response.cookies.get(PUBLIC_ENV_COOKIE)?.value ?? '{}') as Record<string, string>;
  };

  it('serves each instance its own origin and cookie domain from runtime env alone', async () => {
    expect(await served(PROD_ORIGIN)).toEqual({
      APP_URI: PROD_ORIGIN,
      COOKIE_DOMAIN: 'example.com',
    });
    expect(await served('https://dev.rpg.test')).toEqual({ APP_URI: 'https://dev.rpg.test', COOKIE_DOMAIN: 'rpg.test' });
  });

  it('upgrades insecure requests by the instance’s own origin', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_URI', 'http://127.0.0.1:1109');
    const plain = await createMiddleware(CONFIG, NO_HOOKS)(request());
    expect(plain.headers.get(CSP)).not.toContain('upgrade-insecure-requests');
    vi.stubEnv('APP_URI', PROD_ORIGIN);
    const secure = await createMiddleware(CONFIG, NO_HOOKS)(request());
    expect(secure.headers.get(CSP)).toContain('upgrade-insecure-requests');
  });

  it('sends the cookie again only when the browser’s copy is stale', async () => {
    vi.stubEnv('APP_URI', ORIGIN);
    const middleware = createMiddleware(CONFIG, NO_HOOKS);
    const first = await middleware(request());
    const value = first.cookies.get(PUBLIC_ENV_COOKIE)?.value ?? '';
    const again = request();
    again.cookies.set(PUBLIC_ENV_COOKIE, value);
    expect((await middleware(again)).cookies.get(PUBLIC_ENV_COOKIE)).toBeUndefined();
  });

  it('refuses an app’s runtime name that reads as a secret', () => {
    expect(() => createMiddleware({ ...CONFIG, runtimeEnv: ['STRIPE_SECRET'] }, NO_HOOKS)).toThrow('looks like a secret');
  });

  it('proxies the API to the upstream it was started with', async () => {
    const middleware = createMiddleware({ server: { baseUrl: '', upstreamUrl: UPSTREAM } }, NO_HOOKS);
    const response = await middleware(request('/v1/user?x=1'));
    expect(response.headers.get('x-middleware-rewrite')).toBe(`${UPSTREAM}/v1/user?x=1`);
    expect(response.cookies.get(PUBLIC_ENV_COOKIE)).toBeUndefined();
  });
});

describe('apiProxyFor', () => {
  const at = (path: string): URL => new URL(`${ORIGIN}${path}`);

  it('sends the API paths under a relative base to the upstream, and nothing else', () => {
    const root = apiProxyFor({ server: { baseUrl: '', upstreamUrl: `${UPSTREAM}/` } });
    expect(root?.(at('/graphql'))?.href).toBe(`${UPSTREAM}/graphql`);
    expect(root?.(at('/v1/team/1'))?.href).toBe(`${UPSTREAM}/v1/team/1`);
    expect(root?.(at('/team/1'))).toBeUndefined();
    expect(root?.(at('/graphql-docs'))).toBeUndefined();
    const api = apiProxyFor({ server: { baseUrl: '/api', upstreamUrl: UPSTREAM } });
    expect(api?.(at('/api/v1/user'))?.href).toBe(`${UPSTREAM}/v1/user`);
    expect(api?.(at('/v1/user'))).toBeUndefined();
  });

  it('proxies nothing for an absolute base, or with no upstream', () => {
    expect(apiProxyFor({ server: { baseUrl: API_ORIGIN, upstreamUrl: UPSTREAM } })).toBeUndefined();
    expect(apiProxyFor({ server: { baseUrl: '' } })).toBeUndefined();
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
