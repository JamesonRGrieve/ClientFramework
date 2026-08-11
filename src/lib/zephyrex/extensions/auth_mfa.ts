// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import type { ZephyrexClientExtension } from '../types';

const Authenticator = lazy(() => import('@zephyrex/auth/mfa/Authenticator'));
const EmailVerify = lazy(() => import('@zephyrex/auth/mfa/EMail'));
const SmsVerify = lazy(() => import('@zephyrex/auth/mfa/SMS'));

export const authMfaExtension: ZephyrexClientExtension = {
  name: 'auth_mfa',
  displayName: 'Multi-Factor Authentication',
  description: 'TOTP, email, and SMS verification',
  serverExtension: 'auth_mfa',
  authFlow: {
    mfaSetup: ({ otpUri, onComplete }) => Authenticator({ otpUri, onComplete }),
    mfaVerify: ({ type, onVerified }) => {
      if (type === 'email') return EmailVerify({ onVerified });
      if (type === 'sms') return SmsVerify({ onVerified });
      return Authenticator({ onVerified });
    },
  },
};
