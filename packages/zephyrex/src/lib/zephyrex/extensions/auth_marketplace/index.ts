// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';
import { AutoSettingsPanel } from '../../ExtensionRegistry';

export const authMarketplaceExtension = createExtension('auth_marketplace', {
  displayName: 'Marketplace',
  description: 'Extension and integration marketplace',
  managementTabs: [
    {
      id: 'marketplace',
      label: 'Marketplace',
      component: () => AutoSettingsPanel({ extensionName: 'Marketplace' }),
      priority: 70,
    },
  ],
});
