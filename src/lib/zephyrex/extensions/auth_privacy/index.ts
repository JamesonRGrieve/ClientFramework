// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';
import { AutoSettingsPanel } from '../../ExtensionRegistry';

export const authPrivacyExtension = createExtension('auth_privacy', {
  displayName: 'Privacy Settings',
  description: 'User privacy controls and data management',
  managementTabs: [
    { id: 'privacy', label: 'Privacy', component: () => AutoSettingsPanel({ extensionName: 'Privacy' }), priority: 35 },
  ],
});
