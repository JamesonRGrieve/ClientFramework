// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const auditRetentionExtension: ZephyrexClientExtension = {
  name: 'audit_retention',
  displayName: 'Audit Retention',
  serverExtension: 'audit_retention',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Audit Retention' }),
};
