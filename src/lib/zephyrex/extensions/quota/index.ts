// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const quotaExtension: ZephyrexClientExtension = {
  name: 'quota',
  displayName: 'Usage Quotas',
  description: 'Rate limiting and usage cap enforcement',
  serverExtension: 'quota',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Usage Quotas' }),
  managementTabs: [
    { id: 'usage', label: 'Usage', component: () => AutoSettingsPanel({ extensionName: 'Usage Dashboard' }), priority: 45 },
  ],
};
