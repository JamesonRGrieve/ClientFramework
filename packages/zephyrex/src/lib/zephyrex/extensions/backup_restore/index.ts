// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';
import { AutoSettingsPanel } from '../../ExtensionRegistry';

export const backupRestoreExtension = createExtension('backup_restore', {
  displayName: 'Backup & Restore',
  description: 'Database backup and restore management',
  managementTabs: [
    {
      id: 'backup',
      label: 'Backup & Restore',
      component: () => AutoSettingsPanel({ extensionName: 'Backup & Restore' }),
      requireRole: 'superadmin',
      priority: 80,
    },
  ],
});
