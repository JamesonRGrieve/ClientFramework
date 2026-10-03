// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Category 2: Route handler authorization independence.
 *
 * Security invariant: Every route handler must independently enforce
 * authentication and authorization. Middleware is NOT the final auth boundary.
 *
 * A route handler that relies solely on middleware for auth is vulnerable to
 * middleware bypass (path manipulation, internal headers, prefetch routes).
 */
import { basename, relative } from 'path';
import { describe, expect, it } from 'vitest';
import { filesUnder, sourceText } from '../../sourceFiles';

const ROUTE_HANDLER_FILES: ReadonlySet<string> = new Set(['route.ts', 'route.tsx']);
const PUBLIC_ROUTES = new Set(['/api/alive']);

const routeHandlers = filesUnder('src/app').filter((path) => ROUTE_HANDLER_FILES.has(basename(path)));

describe('Route handler auth enforcement', () => {
  it('found at least one route handler to test', () => {
    expect(routeHandlers.length).toBeGreaterThan(0);
  });

  for (const handler of routeHandlers) {
    const routePath = `/${relative('src/app', handler).replace('/route.ts', '').replace('/route.tsx', '')}`;

    if (PUBLIC_ROUTES.has(routePath)) {
      continue;
    }

    describe(routePath, () => {
      const source = sourceText(handler);

      it('must check authentication in the handler itself', () => {
        const hasAuthCheck =
          source.includes('getJWT') ||
          source.includes('getCookie') ||
          source.includes('jwt') ||
          source.includes('Authorization') ||
          source.includes('authenticate') ||
          source.includes('getSession') ||
          source.includes('getServerSession') ||
          source.includes('auth(') ||
          source.includes('verifyJWT') ||
          source.includes('requireAuth') ||
          // The HttpOnly cookie session: the handler reads the session cookie and checks it with the API.
          (source.includes('SESSION_COOKIE') && source.includes('/v1/user'));

        expect(
          hasAuthCheck,
          [
            `AUTH MISSING: Route handler ${routePath} does not check authentication.`,
            'Middleware alone is not sufficient — route handlers must independently verify auth.',
            'A middleware bypass (path encoding, internal headers, prefetch) would expose this route.',
          ].join('\n'),
        ).toBe(true);
      });

      it('must return 401/403 for unauthorized requests', () => {
        const returnsAuthError =
          source.includes('401') ||
          source.includes('403') ||
          source.includes('Unauthorized') ||
          source.includes('Forbidden') ||
          source.includes('NextResponse.redirect');

        expect(
          returnsAuthError,
          [
            `AUTH RESPONSE: Route handler ${routePath} never returns 401/403.`,
            'Without an auth error path, the handler processes all requests regardless of identity.',
          ].join('\n'),
        ).toBe(true);
      });
    });
  }
});
