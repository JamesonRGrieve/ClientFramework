// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import { createExtension } from '../createExtension';

const OAuthProviders = lazy(() => import('@zephyrex/auth/oauth2/OAuthProviders'));

export const authOauthExtension = createExtension('auth_oauth', {
  displayName: 'OAuth2 Authentication',
  description: '50+ OAuth2 provider integrations',
  settingsPanel: undefined,
  authFlow: {
    identifyExtras: () => OAuthProviders({}),
  },
});
