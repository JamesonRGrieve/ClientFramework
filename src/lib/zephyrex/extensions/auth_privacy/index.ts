// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authPrivacyExtension: ZephyrexClientExtension = {
  name: 'auth_privacy',
  displayName: 'Privacy Settings',
  description: 'User privacy controls and data management',
  serverExtension: 'auth_privacy',
  managementTabs: [
    { id: 'privacy', label: 'Privacy', component: () => AutoSettingsPanel({ extensionName: 'Privacy' }), priority: 35 },
  ],
};
