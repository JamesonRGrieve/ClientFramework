// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authRecoveryQuestionsExtension: ZephyrexClientExtension = {
  name: 'auth_recovery_questions',
  displayName: 'Auth Recovery Questions',
  serverExtension: 'auth_recovery_questions',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Recovery Questions' }),
};
