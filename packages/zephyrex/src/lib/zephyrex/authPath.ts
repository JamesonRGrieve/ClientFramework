// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexConfig } from './types';

/** Where the auth pages are mounted when the config doesn't say (`auth.authPath`). */
export const DEFAULT_AUTH_PATH = '/user';

/** The account page, under the auth path. */
export const MANAGE_PAGE = '/manage';

/** Whether the app has accounts: on unless `auth.enabled` is `false`. */
export const accountsEnabled = (config: Pick<ZephyrexConfig, 'auth'>): boolean => config.auth?.enabled !== false;

/**
 * Pages for visitors, without the app's sidebar: the waitlist page every app with a waitlist mounts
 * (SOP Waitlist and Sign-up Gate), plus the app's own `app.visitorPaths`.
 */
const VISITOR_PATHS: readonly string[] = ['/waitlist'];

/**
 * Whether the app's sidebar shows on `pathname`: not on the landing page, the sign-in pages (the
 * account page keeps it) or a visitor page (`/waitlist` and the app's `visitorPaths`, each with what
 * is under it). The no-script menu follows the same rule, so neither lists the app's pages
 * where the other doesn't.
 */
// `pathname` may be null although Next types it a string: outside the app router (a test, a
// pages-router host) usePathname answers null. That counts as the landing page: no sidebar.
export function sidebarShownOn(pathname: string | null, authPath: string, visitorPaths: readonly string[] = []): boolean {
  if (pathname === null) {
    return false;
  }
  if ([...VISITOR_PATHS, ...visitorPaths].some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return false;
  }
  return !(pathname === '/' || (pathname.startsWith(authPath) && pathname !== `${authPath}${MANAGE_PAGE}`));
}
