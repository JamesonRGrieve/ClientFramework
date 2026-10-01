// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';
import { AutoSettingsPanel } from '../../ExtensionRegistry';

export const authMergeExtension = createExtension('auth_merge', {
  displayName: 'Account Merge',
  description: 'Merge multiple accounts into one',
  managementTabs: [
    {
      id: 'merge',
      label: 'Merge Accounts',
      component: () => AutoSettingsPanel({ extensionName: 'Account Merge' }),
      requireRole: 'admin',
      priority: 60,
    },
  ],
});
