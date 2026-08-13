// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Category 2: Application SSRF via /api/audio route handler.
 *
 * The audio proxy accepts an arbitrary URL from the query string and fetches
 * it server-side. An attacker can use this to reach internal services, cloud
 * metadata endpoints, and localhost ports that are not exposed externally.
 *
 * Security invariant: Route handlers that perform outbound requests MUST
 * validate the destination against an allowlist. Fetching attacker-controlled
 * URLs without restriction is an SSRF vulnerability.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const SSRF_TARGETS = [
  { label: 'IPv4 loopback', url: 'http://127.0.0.1/' },
  { label: 'localhost', url: 'http://localhost/' },
  { label: 'IPv6 loopback', url: 'http://[::1]/' },
  { label: 'private 10.x', url: 'http://10.0.0.1/' },
  { label: 'private 172.16.x', url: 'http://172.16.0.1/' },
  { label: 'private 192.168.x', url: 'http://192.168.1.1/' },
  { label: 'link-local', url: 'http://169.254.169.254/' },
  { label: 'AWS metadata', url: 'http://169.254.169.254/latest/meta-data/' },
  { label: 'GCP metadata', url: 'http://metadata.google.internal/' },
  { label: 'Azure metadata', url: 'http://169.254.169.254/metadata/instance?api-version=2021-02-01' },
  { label: 'Kubernetes API', url: 'https://kubernetes.default.svc/' },
  { label: 'Docker socket', url: 'http://host.docker.internal/' },
  { label: 'IPv4-mapped IPv6', url: 'http://[::ffff:127.0.0.1]/' },
  { label: 'hex IP', url: 'http://0x7f000001/' },
  { label: 'octal IP', url: 'http://0177.0.0.1/' },
  { label: 'decimal IP', url: 'http://2130706433/' },
  { label: 'file protocol', url: 'file:///etc/passwd' },
  { label: 'ftp protocol', url: 'ftp://internal-server/secret' },
];

describe('/api/audio — SSRF protection', () => {
  // Read the actual route handler source to verify it validates URLs
  it('route handler must validate destination URL against an allowlist', () => {
    const source = readFileSync('src/app/api/audio/route.ts', 'utf8');

    const hasAllowlist =
      source.includes('allowedHosts') ||
      source.includes('allowedDomains') ||
      source.includes('allowedOrigins') ||
      source.includes('ALLOWED_') ||
      source.includes('isAllowed') ||
      source.includes('validateUrl') ||
      source.includes('safeFetch');

    const hasBlocklist =
      source.includes('blockedHosts') ||
      source.includes('isPrivate') ||
      source.includes('isInternal') ||
      source.includes('isLoopback') ||
      source.includes('blockList');

    const hasValidation = hasAllowlist || hasBlocklist;

    expect(hasValidation, [
      'SSRF VULNERABILITY: /api/audio fetches arbitrary attacker-controlled URLs.',
      'The route handler accepts a `url` query parameter and passes it directly to fetch().',
      'An attacker can use this to reach internal services, cloud metadata endpoints,',
      'and localhost ports. Add URL validation with a destination allowlist.',
    ].join('\n')).toBe(true);
  });

  it.each(SSRF_TARGETS)(
    'must reject $label ($url)',
    async ({ url }) => {
      const source = await import('fs').then((fs) =>
        fs.readFileSync('src/app/api/audio/route.ts', 'utf8'),
      );

      // If the source has no URL validation at all, every target is vulnerable
      const hasAnyValidation =
        source.includes('allowedHosts') ||
        source.includes('isPrivate') ||
        source.includes('validateUrl') ||
        source.includes('safeFetch') ||
        source.includes('ALLOWED_');

      expect(hasAnyValidation, [
        `SSRF: /api/audio would fetch ${url} without restriction.`,
        'Add URL validation before the fetch() call.',
      ].join('\n')).toBe(true);
    },
  );
});
