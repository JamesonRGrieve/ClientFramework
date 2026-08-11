// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authLockoutExtension: ZephyrexClientExtension = {
  name: 'auth_lockout',
  displayName: 'Auth Lockout',
  serverExtension: 'auth_lockout',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Lockout' }),
};
