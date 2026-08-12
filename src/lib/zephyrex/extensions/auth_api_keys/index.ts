// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authApiKeysExtension: ZephyrexClientExtension = {
  name: 'auth_api_keys',
  displayName: 'API Keys',
  description: 'API key generation and management',
  serverExtension: 'auth_api_keys',
  managementTabs: [
    { id: 'api-keys', label: 'API Keys', component: () => AutoSettingsPanel({ extensionName: 'API Keys' }), priority: 25 },
  ],
};
