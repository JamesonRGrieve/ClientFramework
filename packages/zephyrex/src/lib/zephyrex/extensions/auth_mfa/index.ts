// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// The account-page section ships in @zephyrex/auth-mfa, which extends this entry.
export const authMfaExtension = createExtension('auth_mfa', {
  displayName: 'Multi-Factor Authentication',
  description: 'TOTP, email, and SMS verification',
});
