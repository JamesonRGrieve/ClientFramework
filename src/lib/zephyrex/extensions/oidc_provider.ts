// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const oidcProviderExtension: ZephyrexClientExtension = {
  name: 'oidc_provider',
  displayName: 'Oidc Provider',
  serverExtension: 'oidc_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Oidc Provider' }),
};
