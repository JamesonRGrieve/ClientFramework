// SPDX-License-Identifier: AGPL-3.0-or-later
import { getCookie, setCookie } from 'cookies-next/client';
import { cookieDomainOptions } from './publicEnv';

/** The team the signed-in user is working in, kept across visits. */
export const ACTIVE_TEAM_COOKIE = 'auth-team';

/** Shared across the app's subdomains when the instance has a cookie domain; host-only otherwise. */
export { cookieDomainOptions } from './publicEnv';

/** The active team's id, or null when none is set. */
export function activeTeamId(): string | null {
  const team = getCookie(ACTIVE_TEAM_COOKIE);
  return typeof team === 'string' && team !== '' ? team : null;
}

/** Make `teamId` the active team ('' for none), across the app's subdomains where configured. */
export function setActiveTeam(teamId: string): void {
  setCookie(ACTIVE_TEAM_COOKIE, teamId, cookieDomainOptions());
}

/**
 * The team to make active, given the user's `teamIds` and the `current` active one: null when the
 * current one is still among them; else the first team, or '' (none) when the user has none.
 */
export function teamToActivate(teamIds: readonly string[], current: string | undefined): string | null {
  if (current !== undefined && current !== '' && teamIds.includes(current)) {
    return null;
  }
  return teamIds.at(0) ?? '';
}
