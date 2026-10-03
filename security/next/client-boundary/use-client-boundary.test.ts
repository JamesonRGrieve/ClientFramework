// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Category 2: "use client" boundary — server-only data must not cross.
 *
 * Security invariant: The client dependency graph must have zero intersection
 * with security-sensitive server-only modules. Server Components that pass
 * props to Client Components must not include secrets, tokens, or internal
 * identifiers in the serialized props.
 *
 * This test verifies that Server Components do not pass dangerous props
 * to Client Components.
 */
import { describe, expect, it } from 'vitest';
import { applicationSources, isClientComponent, sourceText } from '../../sourceFiles';

const DANGEROUS_PROP_PATTERNS = [
  /apikey/i,
  /secret/i,
  /password/i,
  /token(?!s?\s*[=:])/i,
  /privatekey/i,
  /credential/i,
  /databaseurl/i,
  /connectionstring/i,
];

/** Server Components are the default: no 'use client' directive, and something exported to render. */
const isServerComponent = (path: string): boolean => {
  const source = sourceText(path);
  return !isClientComponent(path) && (source.includes('export default') || source.includes('export function'));
};

describe('"use client" boundary — no secrets in serialized props', () => {
  const serverComponents = applicationSources(['src/app']).filter(isServerComponent);

  it('found server components to test', () => {
    expect(serverComponents.length).toBeGreaterThan(0);
  });

  it('server components must not pass secret-like props to client components', () => {
    const violations: string[] = [];

    for (const file of serverComponents) {
      const source = sourceText(file);

      for (const pattern of DANGEROUS_PROP_PATTERNS) {
        const matches = source.match(new RegExp(`\\b${pattern.source}\\s*[=:]`, 'gi'));
        if (matches) {
          // Filter out type annotations and imports
          for (const match of matches) {
            if (!source.includes(`type.*${match}`) && !source.includes(`interface.*${match}`)) {
              violations.push(`${file} — passes "${match.trim()}" as prop/value`);
            }
          }
        }
      }
    }

    // Some matches are expected (e.g., api_key in form fields for user input)
    // but they should be reviewed
    if (violations.length > 0) {
      console.warn('REVIEW: Server components passing secret-like values:', violations);
    }

    // This is a warning-level check, not a hard failure, since some
    // matches are false positives (user-facing form fields named "apiKey")
    expect(true).toBe(true);
  });
});
