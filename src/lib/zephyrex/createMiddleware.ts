// SPDX-License-Identifier: AGPL-3.0-or-later
import { NextResponse, type NextRequest } from 'next/server';
import type { MiddlewareHook, ZephyrexClientExtension } from './types';

export function createMiddleware(options?: { hooks?: MiddlewareHook[]; extensions?: ZephyrexClientExtension[] }) {
  const extraHooks = options?.hooks ?? [];
  const extensionHooks = (options?.extensions ?? []).flatMap((ext) => ext.middleware ?? []);
  const allHooks = [...extraHooks, ...extensionHooks];

  return async function middleware(req: NextRequest): Promise<NextResponse> {
    // Run built-in auth middleware hooks if available
    try {
      const { useOAuth2, useJWTQueryParam, useAuth } = await import('@zephyrex/auth/auth.middleware');

      const builtinHooks: MiddlewareHook[] = [useOAuth2, useJWTQueryParam, useAuth];

      for (const hook of [...builtinHooks, ...allHooks]) {
        const result = await hook(req);
        if (result.activated) {
          result.response.headers.set('x-next-pathname', req.nextUrl.pathname);
          return result.response;
        }
      }
    } catch {
      // Auth package not available — run only custom hooks
      for (const hook of allHooks) {
        const result = await hook(req);
        if (result.activated) {
          result.response.headers.set('x-next-pathname', req.nextUrl.pathname);
          return result.response;
        }
      }
    }

    const response = NextResponse.next();
    response.headers.set('x-next-pathname', req.nextUrl.pathname);
    return response;
  };
}
