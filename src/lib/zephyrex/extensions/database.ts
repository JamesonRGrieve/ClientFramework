// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const databaseExtension: ZephyrexClientExtension = {
  name: 'database',
  displayName: 'Database',
  serverExtension: 'database',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Database' }),
};
