// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authMarketplaceExtension: ZephyrexClientExtension = {
  name: 'auth_marketplace',
  displayName: 'Marketplace',
  description: 'Extension and integration marketplace',
  serverExtension: 'auth_marketplace',
  managementTabs: [
    { id: 'marketplace', label: 'Marketplace', component: () => AutoSettingsPanel({ extensionName: 'Marketplace' }), priority: 70 },
  ],
};
