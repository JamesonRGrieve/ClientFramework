// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const authLockoutExtension: ZephyrexClientExtension = {
  name: 'auth_lockout',
  displayName: 'Account Lockout',
  description: 'Brute-force protection via temporary account lockout',
  serverExtension: 'auth_lockout',
  // Server-side only — no client UI needed. The server enforces
  // lockout and returns appropriate error messages to the login form.
};
