// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Category 2: Client bundle / server boundary secret leakage.
 *
 * Security invariant: Server-only modules (database clients, secret-bearing
 * modules, privileged helpers) must never appear in the client dependency graph.
 * Client Components cannot accidentally bundle server-only code.
 *
 * This is verified as a source-level check — "use client" files must not
 * import from server-only modules.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const SERVER_ONLY_MODULES = [
  'server-only',
  'database',
  'prisma',
  'drizzle',
  'pg',
  'mysql',
  'mongodb',
  'redis',
  'ioredis',
  'bcrypt',
  'argon2',
  'jsonwebtoken',
  'jose',
  'crypto',
  'child_process',
  'fs',
  'path',
  'os',
  'net',
  'tls',
  'dns',
];

const SERVER_ONLY_PATHS = [
  'src/lib/db/',
  'src/lib/server/',
];

function findClientComponents(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      if (entry.isDirectory()) {
        results.push(...findClientComponents(full));
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        if (entry.name.includes('.test.') || entry.name.includes('.stories.')) continue;
        try {
          const source = readFileSync(full, 'utf8');
          if (source.includes("'use client'") || source.includes('"use client"')) {
            results.push(full);
          }
        } catch {
          // skip
        }
      }
    }
  } catch {
    // skip
  }
  return results;
}

describe('Client/server boundary — secret leakage prevention', () => {
  const clientFiles = findClientComponents('src');

  it('found client components to test', () => {
    expect(clientFiles.length).toBeGreaterThan(0);
  });

  it('client components must not import server-only Node.js modules', () => {
    const violations: string[] = [];
    for (const file of clientFiles) {
      const source = readFileSync(file, 'utf8');
      for (const mod of SERVER_ONLY_MODULES) {
        const importPattern = new RegExp(`from\\s+['"]${mod}['"]`);
        const requirePattern = new RegExp(`require\\s*\\(\\s*['"]${mod}['"]`);
        if (importPattern.test(source) || requirePattern.test(source)) {
          violations.push(`${file} imports server-only module "${mod}"`);
        }
      }
    }

    expect(violations, [
      'CLIENT BOUNDARY VIOLATION: Client components import server-only modules:',
      ...violations,
      'These modules will be bundled into client JavaScript, potentially exposing',
      'server secrets, database connections, or filesystem access to the browser.',
    ].join('\n')).toHaveLength(0);
  });

  it('client components must not import from server-only paths', () => {
    const violations: string[] = [];
    for (const file of clientFiles) {
      const source = readFileSync(file, 'utf8');
      for (const serverPath of SERVER_ONLY_PATHS) {
        if (source.includes(serverPath) || source.includes(serverPath.replace('src/', '@/'))) {
          violations.push(`${file} imports from server-only path "${serverPath}"`);
        }
      }
    }

    expect(violations, [
      'CLIENT BOUNDARY VIOLATION: Client components import server-only paths:',
      ...violations,
    ].join('\n')).toHaveLength(0);
  });
});
