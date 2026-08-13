// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Category 2: Runtime config exposure via /api/alive.
 *
 * Security invariant: Endpoints that expose runtime configuration must either
 * be authenticated or must not contain sensitive information. Exposing the
 * full global runtime config object to unauthenticated clients risks leaking
 * internal URLs, feature flags, credentials, and infrastructure details.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

describe('/api/alive — runtime config exposure', () => {
  const source = readFileSync('src/app/api/alive/route.ts', 'utf8');

  it('must not expose the full globalThis runtime config without auth', () => {
    const exposesGlobalThis =
      source.includes('globalThis') && source.includes('RUNTIME_CONFIG');
    const hasAuth =
      source.includes('getJWT') ||
      source.includes('Authorization') ||
      source.includes('authenticate') ||
      source.includes('getCookie');
    const filtersOutput =
      source.includes('pick') ||
      source.includes('allowedKeys') ||
      source.includes('safeConfig') ||
      source.includes('publicConfig');

    if (exposesGlobalThis) {
      expect(hasAuth || filtersOutput, [
        'INFO DISCLOSURE: /api/alive exposes globalThis runtime config without auth.',
        'An attacker can read internal configuration including URLs, flags, and',
        'potentially credentials. Either require authentication or filter the',
        'response to only include safe public fields.',
      ].join('\n')).toBe(true);
    }
  });

  it('response must not include environment variables or credentials', () => {
    const exposesEnv =
      source.includes('process.env') ||
      source.includes('SECRET') ||
      source.includes('KEY') ||
      source.includes('PASSWORD') ||
      source.includes('TOKEN');

    expect(exposesEnv, [
      'SECRET EXPOSURE: /api/alive may include sensitive environment data.',
    ].join('\n')).toBe(false);
  });
});
