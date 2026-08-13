// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Category 2: Internal Next.js header spoofing.
 *
 * Security invariant: Application code must not trust Next.js internal headers
 * (x-nextjs-*, x-middleware-*, x-invoke-*, x-matched-path) from external
 * clients. These headers are intended for internal framework communication
 * and can be forged by attackers.
 *
 * This test scans all server-side source files for code that reads internal
 * headers and uses them for authorization or routing decisions.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const INTERNAL_HEADERS = [
  'x-nextjs-data',
  'x-middleware-prefetch',
  'x-middleware-subrequest',
  'x-nextjs-router-state-tree',
  'x-nextjs-router-prefetch',
  'x-nextjs-prerender',
  'x-nextjs-rewrite',
  'x-nextjs-redirect',
  'x-invoke-path',
  'x-invoke-query',
  'x-matched-path',
  'next-resume',
];

function scanFiles(dir: string, ext: string[]): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      if (entry.isDirectory()) {
        results.push(...scanFiles(full, ext));
      } else if (ext.some((e) => entry.name.endsWith(e))) {
        results.push(full);
      }
    }
  } catch {
    // skip
  }
  return results;
}

describe('Internal header spoofing protection', () => {
  const serverFiles = scanFiles('src', ['.ts', '.tsx']).filter(
    (f) =>
      !f.includes('.test.') &&
      !f.includes('.stories.') &&
      !f.includes('node_modules'),
  );

  for (const header of INTERNAL_HEADERS) {
    it(`application code must not trust "${header}" from request`, () => {
      const violations: string[] = [];
      for (const file of serverFiles) {
        const source = readFileSync(file, 'utf8');
        if (source.includes(header)) {
          // Check if it's being READ from request (not set on response)
          const lines = source.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!;
            if (
              line.includes(header) &&
              (line.includes('.get(') ||
                line.includes('.has(') ||
                line.includes('headers['))
            ) {
              violations.push(`${file}:${i + 1}`);
            }
          }
        }
      }

      expect(violations, [
        `HEADER SPOOFING: "${header}" is read from incoming requests at:`,
        ...violations.map((v) => `  ${v}`),
        'Internal Next.js headers can be forged by external clients.',
        'Do not use them for authorization or routing decisions.',
      ].join('\n')).toHaveLength(0);
    });
  }
});
