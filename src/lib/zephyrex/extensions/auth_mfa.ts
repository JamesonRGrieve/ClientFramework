// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authMfaExtension: ZephyrexClientExtension = {
  name: 'auth_mfa',
  displayName: 'Auth Mfa',
  serverExtension: 'auth_mfa',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Mfa' }),
};
