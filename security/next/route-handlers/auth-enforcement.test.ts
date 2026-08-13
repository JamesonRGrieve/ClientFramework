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
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

function findRouteHandlers(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findRouteHandlers(full));
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        results.push(full);
      }
    }
  } catch {
    // directory doesn't exist
  }
  return results;
}

const PUBLIC_ROUTES = new Set(['/api/alive']);

const routeHandlers = findRouteHandlers('src/app');

describe('Route handler auth enforcement', () => {
  it('found at least one route handler to test', () => {
    expect(routeHandlers.length).toBeGreaterThan(0);
  });

  for (const handler of routeHandlers) {
    const routePath = '/' + relative('src/app', handler).replace('/route.ts', '').replace('/route.tsx', '');

    if (PUBLIC_ROUTES.has(routePath)) continue;

    describe(routePath, () => {
      const source = readFileSync(handler, 'utf8');

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
          source.includes('requireAuth');

        expect(hasAuthCheck, [
          `AUTH MISSING: Route handler ${routePath} does not check authentication.`,
          'Middleware alone is not sufficient — route handlers must independently verify auth.',
          'A middleware bypass (path encoding, internal headers, prefetch) would expose this route.',
        ].join('\n')).toBe(true);
      });

      it('must return 401/403 for unauthorized requests', () => {
        const returnsAuthError =
          source.includes('401') ||
          source.includes('403') ||
          source.includes('Unauthorized') ||
          source.includes('Forbidden') ||
          source.includes('NextResponse.redirect');

        expect(returnsAuthError, [
          `AUTH RESPONSE: Route handler ${routePath} never returns 401/403.`,
          'Without an auth error path, the handler processes all requests regardless of identity.',
        ].join('\n')).toBe(true);
      });
    });
  }
});
