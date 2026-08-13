// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Category 2: Environment variable hygiene.
 *
 * Security invariant: Server-only secrets must never appear in NEXT_PUBLIC_*
 * variables, client bundles, RSC payloads, or static HTML. The NEXT_PUBLIC_
 * prefix makes variables available to client JavaScript.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SECRET_PATTERNS = [
  /SECRET/i,
  /PASSWORD/i,
  /PRIVATE_KEY/i,
  /API_KEY/i,
  /JWT_SECRET/i,
  /DATABASE_URL/i,
  /DB_PASSWORD/i,
  /ENCRYPTION_KEY/i,
  /SIGNING_KEY/i,
  /CLIENT_SECRET/i,
  /OAUTH_SECRET/i,
  /SMTP_PASSWORD/i,
  /REDIS_PASSWORD/i,
  /MONGO_URI/i,
  /POSTGRES_URI/i,
];

function findEnvFiles(): string[] {
  const candidates = ['.env', '.env.local', '.env.development', '.env.production', '.env.test'];
  return candidates.filter((f) => existsSync(f));
}

describe('Environment variable hygiene', () => {
  it('NEXT_PUBLIC_* must not contain secret-like variable names', () => {
    const violations: string[] = [];

    for (const envFile of findEnvFiles()) {
      const lines = readFileSync(envFile, 'utf8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!.trim();
        if (!line.startsWith('NEXT_PUBLIC_')) continue;
        const varName = line.split('=')[0] ?? '';
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(varName)) {
            violations.push(`${envFile}:${i + 1} — ${varName} looks like a secret but has NEXT_PUBLIC_ prefix`);
          }
        }
      }
    }

    expect(violations, [
      'SECRET EXPOSURE: NEXT_PUBLIC_ variables containing secret-like names:',
      ...violations,
      'NEXT_PUBLIC_ variables are embedded in client JavaScript bundles.',
    ].join('\n')).toHaveLength(0);
  });

  it('source code must not reference server-only env vars in client components', () => {
    const violations: string[] = [];
    const serverOnlyEnvVars = [
      'JWT_SECRET',
      'DATABASE_URL',
      'DB_PASSWORD',
      'API_SECRET',
      'ENCRYPTION_KEY',
      'OAUTH_CLIENT_SECRET',
    ];

    function scanDir(dir: string): void {
      try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.name === 'node_modules' || entry.name === '.next') continue;
          if (entry.isDirectory()) {
            scanDir(full);
          } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            if (entry.name.includes('.test.') || entry.name.includes('.stories.')) continue;
            const source = readFileSync(full, 'utf8');
            if (!source.includes("'use client'")) continue;
            for (const envVar of serverOnlyEnvVars) {
              if (source.includes(envVar)) {
                violations.push(`${full} — client component references server-only ${envVar}`);
              }
            }
          }
        }
      } catch {
        // skip
      }
    }

    scanDir('src');

    expect(violations, [
      'SECRET EXPOSURE: Client components reference server-only env vars:',
      ...violations,
    ].join('\n')).toHaveLength(0);
  });
});
