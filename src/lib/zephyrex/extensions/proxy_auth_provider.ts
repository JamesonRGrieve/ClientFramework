// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const proxyAuthProviderExtension: ZephyrexClientExtension = {
  name: 'proxy_auth_provider',
  displayName: 'Proxy Auth Provider',
  serverExtension: 'proxy_auth_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Proxy Auth Provider' }),
};
