// SPDX-License-Identifier: AGPL-3.0-or-later
import { createAuthMiddleware } from '@zephyrex/auth/auth.middleware';
import { NextResponse, type NextRequest } from 'next/server.js';
import { accountsEnabled, DEFAULT_AUTH_PATH } from './authPath';
import { contentSecurityPolicy, mintNonce, upgradesInsecure } from './contentSecurityPolicy';
import { sessionOnlyAuthPaths } from './pages/user/authPagesConfig';
import { type SignupGate, signupDecision, signupGateFromEnv } from './signupGate';
import type { MiddlewareHook, ZephyrexClientExtension, ZephyrexConfig } from './types';

/** An app that builds its own gate (to log it, say) reads the environment the way this does. */
export { type RegistrationMode, type SignupGate, signupGateFromEnv } from './signupGate';

const ABSOLUTE_URL = /^https?:\/\//;

/**
 * Where the Next server reaches the API: the configured upstream, else an absolute `baseUrl`. It is
 * never taken from the request (its Host header is the client's to choose, and session checks send
 * the user's cookie there), so a same-origin `baseUrl` needs `upstreamUrl`.
 */
export function apiBaseFor({ server }: Pick<ZephyrexConfig, 'server'>): string {
  // An empty upstream (an `.env` that ships `API_URI=`) is no upstream.
  const upstream = server.upstreamUrl?.trim() ?? '';
  const base = (upstream === '' ? server.baseUrl : upstream).replace(/\/$/, '');
  if (!ABSOLUTE_URL.test(base)) {
    throw new Error(
      `ZephyrexConfig.server.upstreamUrl is required when baseUrl is same-origin ('${server.baseUrl}'): it is where the Next server reaches the API.`,
    );
  }
  return base;
}

/**
 * The session guard for `config`: private routes, the account page and the extensions' auth pages
 * that need a signed-in user need a live session.
 */
export const authHookFor = (config: Pick<ZephyrexConfig, 'server' | 'auth' | 'extensions'>): MiddlewareHook =>
  createAuthMiddleware({
    authPath: config.auth?.authPath ?? DEFAULT_AUTH_PATH,
    apiBase: apiBaseFor(config),
    privateRoutes: [...(config.auth?.privateRoutes ?? []), ...sessionOnlyAuthPaths(config)],
    landingOnly: config.auth?.landingOnly ?? false,
  });

/** The request header that carries this response's CSP nonce to server components. */
export const NONCE_HEADER = 'x-nonce';
const CSP_HEADER = 'Content-Security-Policy';
/** Next's own not-found page: rendered at this path, it answers 404. */
const NOT_FOUND_ROUTE = '/_not-found';

/**
 * Next.js middleware that first turns the sign-up page away when sign-up is closed, or sends it to the
 * welcome page under single sign-on (`REGISTRATION_MODE`, see signupGate), then runs the session guard, then any app hooks, then every extension's
 * hooks, in that order. The first hook that activates answers the request; otherwise the request
 * continues. Every response carries `x-next-pathname` and a Content-Security-Policy with a fresh
 * nonce, which the continuing request also carries so Next stamps it on its own scripts.
 */
export function createMiddleware(
  config: Pick<ZephyrexConfig, 'server' | 'auth' | 'extensions' | 'contentSecurityPolicy'>,
  options?: {
    hooks?: MiddlewareHook[];
    builtinHooks?: readonly MiddlewareHook[];
    /** Sign-up's mode and where it is sent while closed; read from the environment by default. */
    signupGate?: SignupGate;
  },
): (req: NextRequest) => Promise<NextResponse> {
  const hooks = [
    // An app without accounts has no session to guard (and may have no API to check one against).
    ...(options?.builtinHooks ?? (accountsEnabled(config) ? [authHookFor(config)] : [])),
    ...(options?.hooks ?? []),
    ...(config.extensions ?? []).flatMap((ext: ZephyrexClientExtension) => ext.middleware ?? []),
  ];

  // An app without accounts has no sign-up page to guard.
  const gate = accountsEnabled(config) ? (options?.signupGate ?? signupGateFromEnv()) : undefined;
  const authPath = config.auth?.authPath ?? DEFAULT_AUTH_PATH;

  const development = process.env.NODE_ENV !== 'production';
  const upgradeInsecure = upgradesInsecure(development, process.env.NEXT_PUBLIC_APP_URI);

  return async function middleware(req: NextRequest): Promise<NextResponse> {
    const nonce = mintNonce();
    const policy = contentSecurityPolicy({
      nonce,
      development,
      upgradeInsecure,
      ...(config.contentSecurityPolicy === undefined ? {} : { additions: config.contentSecurityPolicy }),
    });
    const finish = (response: NextResponse): NextResponse => {
      response.headers.set('x-next-pathname', req.nextUrl.pathname);
      response.headers.set(CSP_HEADER, policy);
      return response;
    };
    // The request headers a continuing (or rewritten) request carries, so Next stamps the nonce.
    const requestHeaders = (): Headers => {
      const headers = new Headers(req.headers);
      headers.set(NONCE_HEADER, nonce);
      headers.set(CSP_HEADER, policy);
      return headers;
    };
    const continueRequest = (): NextResponse => NextResponse.next({ request: { headers: requestHeaders() } });
    // Hooks are order-dependent: each may short-circuit the ones after it.
    const runFrom = async (index: number): Promise<NextResponse> => {
      const hook = hooks.at(index);
      if (hook === undefined) {
        return finish(continueRequest());
      }
      const result = await hook(req);
      return result.activated ? finish(result.response) : runFrom(index + 1);
    };
    const signup = gate === undefined ? undefined : signupDecision(new URL(req.url), authPath, gate);
    if (signup?.kind === 'redirect') {
      return finish(NextResponse.redirect(signup.url));
    }
    if (signup?.kind === 'notFound') {
      return finish(NextResponse.rewrite(new URL(NOT_FOUND_ROUTE, req.url), { request: { headers: requestHeaders() } }));
    }
    return runFrom(0);
  };
}
