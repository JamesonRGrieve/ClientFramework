// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authMarketplaceExtension: ZephyrexClientExtension = {
  name: 'auth_marketplace',
  displayName: 'Auth Marketplace',
  serverExtension: 'auth_marketplace',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Marketplace' }),
};
