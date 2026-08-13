// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Category 2: Middleware is NOT the final authorization boundary.
 *
 * Security invariant: Every data-mutating endpoint (axios.post/put/patch/delete)
 * must include an Authorization header from the current session, not rely on
 * middleware having already verified the user.
 *
 * This test scans all client-side API calls and verifies they include auth headers.
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

describe('API calls include authorization', () => {
  const files = scanFiles('src');

  it('axios mutation calls must include Authorization header', () => {
    const violations: string[] = [];
    const mutationMethods = ['axios.post', 'axios.put', 'axios.patch', 'axios.delete'];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const lines = source.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        for (const method of mutationMethods) {
          if (line.includes(method)) {
            // Check next ~20 lines for Authorization header
            const context = lines.slice(i, Math.min(i + 20, lines.length)).join('\n');
            if (!context.includes('Authorization') && !context.includes('authorization')) {
              violations.push(`${file}:${i + 1} — ${method} without Authorization header`);
            }
          }
        }
      }
    }

    expect(violations, [
      'AUTH MISSING: API mutation calls without Authorization header:',
      ...violations,
      'Without per-request auth, these calls rely solely on middleware/cookies.',
      'A middleware bypass would allow unauthenticated mutations.',
    ].join('\n')).toHaveLength(0);
  });
});
