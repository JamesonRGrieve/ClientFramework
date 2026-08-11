// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authPrivacyExtension: ZephyrexClientExtension = {
  name: 'auth_privacy',
  displayName: 'Auth Privacy',
  serverExtension: 'auth_privacy',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Privacy' }),
};
