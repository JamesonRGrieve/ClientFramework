// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { authSessionExtension as registered } from 'zephyrex/extensions/auth_session';
import { Sessions } from './Sessions';

const SESSIONS_PRIORITY = 20;

/** The auth_session client extension with its account-page section, for an app's `extensions`. */
export const authSessionExtension: ZephyrexClientExtension = {
  ...registered,
  managementTabs: [{ id: 'sessions', label: 'Active Sessions', component: Sessions, priority: SESSIONS_PRIORITY }],
};
