// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, mintNonce } from './contentSecurityPolicy';

const directive = (policy: string, name: string): string[] =>
  policy
    .split('; ')
    .find((entry) => entry.startsWith(`${name} `))
    ?.split(' ')
    .slice(1) ?? [];

describe('contentSecurityPolicy', () => {
  it('runs scripts only by nonce or from a trusted script, with no plugins, framing or base rewrites', () => {
    const policy = contentSecurityPolicy({ nonce: 'abc', development: false });
    const scripts = directive(policy, 'script-src');
    expect(scripts).toEqual(expect.arrayContaining(["'self'", "'strict-dynamic'", "'nonce-abc'"]));
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain('upgrade-insecure-requests');
    expect(policy).not.toContain('unsafe-eval');
  });

  it('lets the provider frames in', () => {
    const frameSources = directive(contentSecurityPolicy({ nonce: 'n', development: false }), 'frame-src');
    expect(frameSources).toEqual(expect.arrayContaining(['https://js.stripe.com', 'https://www.google.com']));
  });

  it('allows what the dev server needs only in development', () => {
    const policy = contentSecurityPolicy({ nonce: 'n', development: true });
    expect(directive(policy, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(policy, 'connect-src')).toContain('ws:');
    expect(policy).not.toContain('upgrade-insecure-requests');
  });

  it('adds an app’s sources without repeating the framework’s', () => {
    const policy = contentSecurityPolicy({
      nonce: 'n',
      development: false,
      additions: { 'connect-src': ["'self'", 'https://analytics.example.org'] },
    });
    expect(directive(policy, 'connect-src')).toEqual(["'self'", 'https://analytics.example.org']);
  });
});

describe('mintNonce', () => {
  it('is fresh base64 each time', () => {
    const first = mintNonce();
    expect(first).toMatch(/^[\w+/]+=*$/);
    expect(mintNonce()).not.toBe(first);
  });
});
