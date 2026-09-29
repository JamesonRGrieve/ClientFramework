// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, type ReactElement } from 'react';
import { AutoSettingsPanel } from '../../ExtensionRegistry';
import { createExtension } from '../createExtension';

function UsageSection(): ReactElement {
  return createElement(AutoSettingsPanel, { extensionName: 'Usage Dashboard' });
}

export const quotaExtension = createExtension('quota', {
  displayName: 'Usage Quotas',
  description: 'Rate limiting and usage cap enforcement',
  managementTabs: [{ id: 'usage', label: 'Usage', component: UsageSection, priority: 45 }],
});
