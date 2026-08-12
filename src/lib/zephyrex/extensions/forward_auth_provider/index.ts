// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const forwardAuthProviderExtension: ZephyrexClientExtension = {
  name: 'forward_auth_provider',
  displayName: 'Forward Auth Provider',
  serverExtension: 'forward_auth_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Forward Auth Provider' }),
};
