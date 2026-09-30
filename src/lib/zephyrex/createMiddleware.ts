// SPDX-License-Identifier: AGPL-3.0-or-later
import { useAuth, useJWTQueryParam, useOAuth2 } from '@zephyrex/auth/auth.middleware';
import { NextResponse, type NextRequest } from 'next/server.js';
import type { MiddlewareHook, ZephyrexClientExtension } from './types';

const BUILTIN_HOOKS: readonly MiddlewareHook[] = [useOAuth2, useJWTQueryParam, useAuth];

/**
 * Next.js middleware that runs the built-in auth hooks, then any app hooks, then every
 * extension's hooks, in that order. The first hook that activates answers the request;
 * otherwise the request continues. Every response carries `x-next-pathname`.
 */
export function createMiddleware(options?: {
  hooks?: MiddlewareHook[];
  extensions?: ZephyrexClientExtension[];
  builtinHooks?: readonly MiddlewareHook[];
}): (req: NextRequest) => Promise<NextResponse> {
  const hooks = [
    ...(options?.builtinHooks ?? BUILTIN_HOOKS),
    ...(options?.hooks ?? []),
    ...(options?.extensions ?? []).flatMap((ext) => ext.middleware ?? []),
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
