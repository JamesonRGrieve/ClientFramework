// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authLdapExtension: ZephyrexClientExtension = {
  name: 'auth_ldap',
  displayName: 'Auth Ldap',
  serverExtension: 'auth_ldap',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Ldap' }),
};
