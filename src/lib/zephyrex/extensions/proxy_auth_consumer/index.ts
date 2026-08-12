// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const proxyAuthConsumerExtension: ZephyrexClientExtension = {
  name: 'proxy_auth_consumer',
  displayName: 'Proxy Auth Consumer',
  serverExtension: 'proxy_auth_consumer',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Proxy Auth Consumer' }),
};
