// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Category 2: SSRF prevention for all server-side outbound fetches.
 *
 * Security invariant: Server-side code that constructs URLs from user input
 * must validate destinations. Attacker-controlled URLs must not reach
 * internal networks, cloud metadata, or localhost.
 *
 * Scans all server-side fetch/axios calls for user-controlled URL construction.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

function scanFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      if (entry.isDirectory()) {
        results.push(...scanFiles(full));
      } else if (
        (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
        !entry.name.includes('.test.') &&
        !entry.name.includes('.stories.')
      ) {
        results.push(full);
      }
    }
  } catch {
    // skip
  }
  return results;
}

describe('SSRF — server-side outbound fetch validation', () => {
  const serverFiles = scanFiles('src/app/api');

  it('route handlers must not fetch user-controlled URLs without validation', () => {
    const violations: string[] = [];

    for (const file of serverFiles) {
      const source = readFileSync(file, 'utf8');
      const lines = source.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        // Look for fetch() calls where the URL comes from request params
        if (
          (line.includes('fetch(') || line.includes('axios.get(')) &&
          (line.includes('url') || line.includes('request') || line.includes('searchParams'))
        ) {
          // Check if there's URL validation nearby
          const context = lines.slice(Math.max(0, i - 10), i + 5).join('\n');
          const hasValidation =
            context.includes('isAllowed') ||
            context.includes('validateUrl') ||
            context.includes('allowedHosts') ||
            context.includes('allowedDomains') ||
            context.includes('URL') && context.includes('hostname') ||
            context.includes('blocklist') ||
            context.includes('isPrivate');

          if (!hasValidation) {
            violations.push(`${file}:${i + 1} — fetch with potentially user-controlled URL`);
          }
        }
      }
    }

    expect(violations, [
      'SSRF: Route handlers perform outbound fetches without URL validation:',
      ...violations,
      'Validate destination hostnames against an allowlist before fetching.',
    ].join('\n')).toHaveLength(0);
  });
});

describe('SSRF — WebSocket destination validation', () => {
  it('useSubscription must not allow attacker-controlled WebSocket URLs', () => {
    const source = readFileSync('src/lib/zephyrex/useSubscription.ts', 'utf8');

    // The WebSocket URL is derived from config.server.baseUrl, which is
    // set in zephyrex.config.ts from process.env. This is safe as long as
    // the env var is controlled by the operator, not the client.
    const usesConfig = source.includes('config.server.baseUrl');
    const usesUserInput =
      source.includes('searchParams') ||
      source.includes('request.url') ||
      source.includes('query');

    expect(usesUserInput, [
      'SSRF: WebSocket URL derived from user-controlled input.',
      'WebSocket destinations must come from server configuration, not client input.',
    ].join('\n')).toBe(false);
  });
});
