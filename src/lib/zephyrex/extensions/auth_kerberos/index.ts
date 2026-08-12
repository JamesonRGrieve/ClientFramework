// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authKerberosExtension: ZephyrexClientExtension = {
  name: 'auth_kerberos',
  displayName: 'Auth Kerberos',
  serverExtension: 'auth_kerberos',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Kerberos' }),
};
