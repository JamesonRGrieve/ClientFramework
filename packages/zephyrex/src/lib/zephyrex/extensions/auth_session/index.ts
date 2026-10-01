// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// The account-page section ships in @zephyrex/auth-session, which extends this entry.
export const authSessionExtension = createExtension('auth_session', {
  displayName: 'Session Management',
  description: 'Active session tracking and revocation',
});
