// SPDX-License-Identifier: AGPL-3.0-or-later

/** The team the signed-in user is working in, kept across visits. */
export const ACTIVE_TEAM_COOKIE = 'auth-team';

/** Shared across the app's subdomains when NEXT_PUBLIC_COOKIE_DOMAIN is set; host-only otherwise. */
export function cookieDomainOptions(): { domain?: string } {
  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  return domain !== undefined && domain !== '' ? { domain } : {};
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
