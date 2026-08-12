// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const x509ProviderExtension: ZephyrexClientExtension = {
  name: 'x509_provider',
  displayName: 'X509 Provider',
  serverExtension: 'x509_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'X509 Provider' }),
};
