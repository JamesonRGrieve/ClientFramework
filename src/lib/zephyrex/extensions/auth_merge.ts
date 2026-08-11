// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authMergeExtension: ZephyrexClientExtension = {
  name: 'auth_merge',
  displayName: 'Account Merge',
  description: 'Merge multiple accounts into one',
  serverExtension: 'auth_merge',
  managementTabs: [
    { id: 'merge', label: 'Merge Accounts', component: () => AutoSettingsPanel({ extensionName: 'Account Merge' }), requireRole: 'admin', priority: 60 },
  ],
};
