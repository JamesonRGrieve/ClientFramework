// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const databaseMemoryExtension: ZephyrexClientExtension = {
  name: 'database_memory',
  displayName: 'Database Memory',
  serverExtension: 'database_memory',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Database Memory' }),
};
