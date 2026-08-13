// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import { createExtension } from '../createExtension';

const Authenticator = lazy(() => import('@zephyrex/auth/mfa/Authenticator'));
const EmailVerify = lazy(() => import('@zephyrex/auth/mfa/EMail'));
const SmsVerify = lazy(() => import('@zephyrex/auth/mfa/SMS'));

export const authMfaExtension = createExtension('auth_mfa', {
  displayName: 'Multi-Factor Authentication',
  description: 'TOTP, email, and SMS verification',
  authFlow: {
    mfaSetup: ({ verifiedCallback }) => Authenticator({ verifiedCallback }),
    mfaVerify: ({ type, verifiedCallback }) => {
      if (type === 'email') return EmailVerify({ verifiedCallback });
      if (type === 'sms') return SmsVerify({ verifiedCallback });
      return Authenticator({ verifiedCallback });
    },
  },
});
