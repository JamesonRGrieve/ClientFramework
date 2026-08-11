// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const ldapProviderExtension: ZephyrexClientExtension = {
  name: 'ldap_provider',
  displayName: 'Ldap Provider',
  serverExtension: 'ldap_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Ldap Provider' }),
};
