// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const kerberosConsumerExtension: ZephyrexClientExtension = {
  name: 'kerberos_consumer',
  displayName: 'Kerberos Consumer',
  serverExtension: 'kerberos_consumer',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Kerberos Consumer' }),
};
