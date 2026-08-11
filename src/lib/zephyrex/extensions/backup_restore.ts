// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const backupRestoreExtension: ZephyrexClientExtension = {
  name: 'backup_restore',
  displayName: 'Backup & Restore',
  description: 'Database backup and restore management',
  serverExtension: 'backup_restore',
  managementTabs: [
    { id: 'backup', label: 'Backup & Restore', component: () => AutoSettingsPanel({ extensionName: 'Backup & Restore' }), requireRole: 'superadmin', priority: 80 },
  ],
};
