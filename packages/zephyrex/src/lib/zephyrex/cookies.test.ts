// SPDX-License-Identifier: AGPL-3.0-or-later
import { deleteCookie, getCookie } from 'cookies-next/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACTIVE_TEAM_COOKIE, activeTeamId, cookieDomainOptions, setActiveTeam, teamToActivate } from './cookies';

describe('the active team', () => {
  afterEach(() => {
    deleteCookie(ACTIVE_TEAM_COOKIE);
  });

  it('is kept in the auth-team cookie, and none is null', () => {
    expect(activeTeamId()).toBeNull();
    setActiveTeam('t1');
    expect(getCookie(ACTIVE_TEAM_COOKIE)).toBe('t1');
    expect(activeTeamId()).toBe('t1');
    setActiveTeam('');
    expect(activeTeamId()).toBeNull();
  });
});

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
