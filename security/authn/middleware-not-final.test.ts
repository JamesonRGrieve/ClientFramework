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
import { applicationSources, sourceText } from '../sourceFiles';

describe('API calls include authorization', () => {
  const files = applicationSources();

  it('axios mutation calls must include Authorization header', () => {
    const violations: string[] = [];
    const mutationMethods = ['axios.post', 'axios.put', 'axios.patch', 'axios.delete'];

    for (const file of files) {
      const source = sourceText(file);
      const lines = source.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
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

    expect(
      violations,
      [
        'AUTH MISSING: API mutation calls without Authorization header:',
        ...violations,
        'Without per-request auth, these calls rely solely on middleware/cookies.',
        'A middleware bypass would allow unauthenticated mutations.',
      ].join('\n'),
    ).toHaveLength(0);
  });
});
