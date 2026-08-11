// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const backupRestoreExtension: ZephyrexClientExtension = {
  name: 'backup_restore',
  displayName: 'Backup & Restore',
  description: 'Database backup and restore management',
  serverExtension: 'backup_restore',
  // Admin-only feature. Could add a backup trigger/restore UI
  // as a settings panel gated by RequireRole('superadmin').
};
