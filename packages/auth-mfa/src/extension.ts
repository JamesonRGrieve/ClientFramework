// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { authMfaExtension as registered } from 'zephyrex/extensions/auth_mfa';
import { MfaSettings } from './MfaSettings';

const MFA_PRIORITY = 20;

/** The auth_mfa client extension with its account-page section, for an app's `extensions`. */
export const authMfaExtension: ZephyrexClientExtension = {
  ...registered,
  managementTabs: [{ id: 'mfa', label: 'Two-factor authentication', component: MfaSettings, priority: MFA_PRIORITY }],
};
