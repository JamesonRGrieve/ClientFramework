// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authMergeExtension: ZephyrexClientExtension = {
  name: 'auth_merge',
  displayName: 'Auth Merge',
  serverExtension: 'auth_merge',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Merge' }),
};
