// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import type { ZephyrexClientExtension } from '../types';

const OAuthProviders = lazy(() => import('@zephyrex/auth/oauth2/OAuthProviders'));

export const authOauthExtension: ZephyrexClientExtension = {
  name: 'auth_oauth',
  displayName: 'OAuth2 Authentication',
  description: '50+ OAuth2 provider integrations',
  serverExtension: 'auth_oauth',
  authFlow: {
    identifyExtras: () => OAuthProviders({}),
  },
};
