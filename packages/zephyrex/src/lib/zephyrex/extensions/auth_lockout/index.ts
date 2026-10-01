// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

export const authLockoutExtension = createExtension('auth_lockout', {
  displayName: 'Account Lockout',
  description: 'Brute-force protection via temporary account lockout',
});
