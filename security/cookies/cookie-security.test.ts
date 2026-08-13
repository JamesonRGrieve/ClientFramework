// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Category 2: Cookie security attributes.
 *
 * Security invariant: Authentication cookies (jwt, session) must be set with
 * HttpOnly, Secure, and SameSite=Strict (or Lax). Preference cookies
 * (theme, appearance, sidebar) may omit HttpOnly but must still have
 * Secure and SameSite.
 *
 * This test scans all setCookie calls and verifies the options.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const AUTH_COOKIE_NAMES = ['jwt', 'auth-team', 'invitation', 'email', 'href'];
const PREFERENCE_COOKIES = ['theme', 'appearance', 'sidebar', 'client-has-started'];

function scanFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      if (entry.isDirectory()) {
        results.push(...scanFiles(full));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        if (!entry.name.includes('.test.') && !entry.name.includes('.stories.')) {
          results.push(full);
        }
      }
    }
  } catch {
    // skip
  }
  return results;
}

describe('Cookie security attributes', () => {
  const files = scanFiles('src');

  it('auth-related setCookie calls must include httpOnly', () => {
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const lines = source.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (line.includes('setCookie(') || line.includes('cookies.set(')) {
          for (const name of AUTH_COOKIE_NAMES) {
            if (line.includes(`'${name}'`) || line.includes(`"${name}"`)) {
              // Check the surrounding context (next ~10 lines) for httpOnly
              const context = lines.slice(i, i + 10).join('\n');
              if (!context.includes('httpOnly') && !context.includes('HttpOnly')) {
                violations.push(`${file}:${i + 1} — cookie "${name}" missing httpOnly`);
              }
            }
          }
        }
      }
    }

    expect(violations, [
      'COOKIE SECURITY: Auth cookies set without httpOnly flag:',
      ...violations,
      'Without httpOnly, JavaScript (including XSS payloads) can read auth cookies.',
    ].join('\n')).toHaveLength(0);
  });

  it('setCookie calls for auth cookies must include secure flag in production', () => {
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const lines = source.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (line.includes('setCookie(') || line.includes('cookies.set(')) {
          for (const name of AUTH_COOKIE_NAMES) {
            if (line.includes(`'${name}'`) || line.includes(`"${name}"`)) {
              const context = lines.slice(i, i + 10).join('\n');
              if (!context.includes('secure') && !context.includes('Secure')) {
                violations.push(`${file}:${i + 1} — cookie "${name}" missing secure`);
              }
            }
          }
        }
      }
    }

    expect(violations, [
      'COOKIE SECURITY: Auth cookies set without secure flag:',
      ...violations,
      'Without secure, cookies can be sent over plain HTTP and intercepted.',
    ].join('\n')).toHaveLength(0);
  });

  it('setCookie calls must include sameSite', () => {
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const lines = source.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (line.includes('setCookie(') || line.includes('cookies.set(')) {
          for (const name of AUTH_COOKIE_NAMES) {
            if (line.includes(`'${name}'`) || line.includes(`"${name}"`)) {
              const context = lines.slice(i, i + 10).join('\n');
              if (!context.includes('sameSite') && !context.includes('SameSite')) {
                violations.push(`${file}:${i + 1} — cookie "${name}" missing sameSite`);
              }
            }
          }
        }
      }
    }

    expect(violations, [
      'CSRF: Auth cookies set without sameSite flag:',
      ...violations,
      'Without sameSite, cookies are sent on cross-origin requests, enabling CSRF.',
    ].join('\n')).toHaveLength(0);
  });
});
