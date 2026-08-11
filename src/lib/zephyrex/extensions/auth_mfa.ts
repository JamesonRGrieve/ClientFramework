// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const authMfaExtension: ZephyrexClientExtension = {
  name: 'auth_mfa',
  displayName: 'Multi-Factor Authentication',
  description: 'TOTP, email, and SMS verification',
  serverExtension: 'auth_mfa',
  // MFA setup/verify components render automatically in the auth flow
  // via @zephyrex/auth's Router when the server returns otp_uri,
  // verify_email, or verify_sms flags during registration.
};
