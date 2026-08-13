// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';
import { AutoSettingsPanel } from '../../ExtensionRegistry';

export const quotaExtension = createExtension('quota', {
  displayName: 'Usage Quotas',
  description: 'Rate limiting and usage cap enforcement',
  managementTabs: [
    { id: 'usage', label: 'Usage', component: () => AutoSettingsPanel({ extensionName: 'Usage Dashboard' }), priority: 45 },
  ],
});
