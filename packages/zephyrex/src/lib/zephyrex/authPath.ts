// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexConfig } from './types';

/** Where the auth pages are mounted when the config doesn't say (`auth.authPath`). */
export const DEFAULT_AUTH_PATH = '/user';

/** The account page, under the auth path. */
export const MANAGE_PAGE = '/manage';

/** Whether the app has accounts: on unless `auth.enabled` is `false`. */
export const accountsEnabled = (config: Pick<ZephyrexConfig, 'auth'>): boolean => config.auth?.enabled !== false;
