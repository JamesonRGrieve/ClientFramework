// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

export const authRecoveryQuestionsExtension = createExtension('auth_recovery_questions', {
  displayName: 'Recovery Questions',
  description: 'Security question-based account recovery',
});
