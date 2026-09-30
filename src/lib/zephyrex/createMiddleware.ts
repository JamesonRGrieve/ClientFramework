// SPDX-License-Identifier: AGPL-3.0-or-later
import { createAuthMiddleware } from '@zephyrex/auth/auth.middleware';
import { NextResponse, type NextRequest } from 'next/server.js';
import { DEFAULT_AUTH_PATH } from './authPath';
import type { MiddlewareHook, ZephyrexClientExtension, ZephyrexConfig } from './types';

const ABSOLUTE_URL = /^https?:\/\//;

/**
 * Where the Next server reaches the API: the configured upstream, else an absolute `baseUrl`. It is
 * never taken from the request (its Host header is the client's to choose, and session checks send
 * the user's cookie there), so a same-origin `baseUrl` needs `upstreamUrl`.
 */
export function apiBaseFor({ server }: Pick<ZephyrexConfig, 'server'>): string {
  const base = (server.upstreamUrl ?? server.baseUrl).replace(/\/$/, '');
  if (!ABSOLUTE_URL.test(base)) {
    throw new Error(
      `ZephyrexConfig.server.upstreamUrl is required when baseUrl is same-origin ('${server.baseUrl}'): it is where the Next server reaches the API.`,
    );
  }
  return base;
}

/** The session guard for `config`: private routes and the account page need a live session. */
export const authHookFor = (config: Pick<ZephyrexConfig, 'server' | 'auth'>): MiddlewareHook =>
  createAuthMiddleware({
    authPath: config.auth?.authPath ?? DEFAULT_AUTH_PATH,
    apiBase: apiBaseFor(config),
    privateRoutes: config.auth?.privateRoutes ?? [],
    landingOnly: config.auth?.landingOnly ?? false,
  });

/**
 * Next.js middleware that runs the session guard, then any app hooks, then every extension's
 * hooks, in that order. The first hook that activates answers the request; otherwise the request
 * continues. Every response carries `x-next-pathname`.
 */
export function createMiddleware(
  config: Pick<ZephyrexConfig, 'server' | 'auth' | 'extensions'>,
  options?: {
    hooks?: MiddlewareHook[];
    builtinHooks?: readonly MiddlewareHook[];
  },
): (req: NextRequest) => Promise<NextResponse> {
  const hooks = [
    ...(options?.builtinHooks ?? [authHookFor(config)]),
    ...(options?.hooks ?? []),
    ...(config.extensions ?? []).flatMap((ext: ZephyrexClientExtension) => ext.middleware ?? []),
  ];

  return async function middleware(req: NextRequest): Promise<NextResponse> {
    const withPathname = (response: NextResponse): NextResponse => {
      response.headers.set('x-next-pathname', req.nextUrl.pathname);
      return response;
    };
    // Hooks are order-dependent: each may short-circuit the ones after it.
    const runFrom = async (index: number): Promise<NextResponse> => {
      const hook = hooks.at(index);
      if (hook === undefined) {
        return withPathname(NextResponse.next());
      }
      const result = await hook(req);
      return result.activated ? withPathname(result.response) : runFrom(index + 1);
    };
    return runFrom(0);
  };
}
