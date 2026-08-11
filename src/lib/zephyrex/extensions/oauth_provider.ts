// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const oauthProviderExtension: ZephyrexClientExtension = {
  name: 'oauth_provider',
  displayName: 'Oauth Provider',
  serverExtension: 'oauth_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Oauth Provider' }),
};
