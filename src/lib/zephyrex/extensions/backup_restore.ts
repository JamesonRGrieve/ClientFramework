// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const backupRestoreExtension: ZephyrexClientExtension = {
  name: 'backup_restore',
  displayName: 'Backup Restore',
  serverExtension: 'backup_restore',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Backup Restore' }),
};
