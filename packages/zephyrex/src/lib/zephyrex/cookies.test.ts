// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cookieDomainOptions, teamToActivate } from './cookies';

describe('cookieDomainOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shares cookies across subdomains only when a domain is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_COOKIE_DOMAIN', '.example.com');
    expect(cookieDomainOptions()).toEqual({ domain: '.example.com' });
    vi.stubEnv('NEXT_PUBLIC_COOKIE_DOMAIN', '');
    expect(cookieDomainOptions()).toEqual({});
  });
});

describe('teamToActivate', () => {
  it('keeps an active team the user still belongs to', () => {
    expect(teamToActivate(['t1', 't2'], 't2')).toBeNull();
  });

  it('falls back to the first team, or none, otherwise', () => {
    expect(teamToActivate(['t1', 't2'], 'gone')).toBe('t1');
    expect(teamToActivate(['t1'], undefined)).toBe('t1');
    expect(teamToActivate(['t1'], '')).toBe('t1');
    expect(teamToActivate([], 'gone')).toBe('');
  });
});
