// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const authRecoveryQuestionsExtension: ZephyrexClientExtension = {
  name: 'auth_recovery_questions',
  displayName: 'Recovery Questions',
  description: 'Security question-based account recovery',
  serverExtension: 'auth_recovery_questions',
};
