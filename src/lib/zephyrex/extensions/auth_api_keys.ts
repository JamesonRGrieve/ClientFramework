// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authApiKeysExtension: ZephyrexClientExtension = {
  name: 'auth_api_keys',
  displayName: 'Auth Api Keys',
  serverExtension: 'auth_api_keys',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Api Keys' }),
};
