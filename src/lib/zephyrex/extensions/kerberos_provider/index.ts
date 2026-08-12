// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const kerberosProviderExtension: ZephyrexClientExtension = {
  name: 'kerberos_provider',
  displayName: 'Kerberos Provider',
  serverExtension: 'kerberos_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Kerberos Provider' }),
};
