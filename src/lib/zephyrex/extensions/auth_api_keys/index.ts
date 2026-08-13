// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';
import { AutoSettingsPanel } from '../../ExtensionRegistry';

export const authApiKeysExtension = createExtension('auth_api_keys', {
  displayName: 'API Keys',
  description: 'API key generation and management',
  managementTabs: [
    { id: 'api-keys', label: 'API Keys', component: () => AutoSettingsPanel({ extensionName: 'API Keys' }), priority: 25 },
  ],
});
