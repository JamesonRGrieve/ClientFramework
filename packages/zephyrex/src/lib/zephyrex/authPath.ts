// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexConfig } from './types';

/** Where the auth pages are mounted when the config doesn't say (`auth.authPath`). */
export const DEFAULT_AUTH_PATH = '/user';

/** The account page, under the auth path. */
export const MANAGE_PAGE = '/manage';

/** Whether the app has accounts: on unless `auth.enabled` is `false`. */
export const accountsEnabled = (config: Pick<ZephyrexConfig, 'auth'>): boolean => config.auth?.enabled !== false;

/**
 * Whether the app's sidebar shows on `pathname`: not on the landing page or the sign-in pages (the
 * account page keeps it). The no-script menu follows the same rule, so neither lists the app's pages
 * where the other doesn't.
 */
export function sidebarShownOn(pathname: string, authPath: string): boolean {
  return !(pathname === '/' || (pathname.startsWith(authPath) && pathname !== `${authPath}${MANAGE_PAGE}`));
}
