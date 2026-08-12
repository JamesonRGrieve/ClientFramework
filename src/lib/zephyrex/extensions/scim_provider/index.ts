// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const scimProviderExtension: ZephyrexClientExtension = {
  name: 'scim_provider',
  displayName: 'Scim Provider',
  serverExtension: 'scim_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Scim Provider' }),
};
