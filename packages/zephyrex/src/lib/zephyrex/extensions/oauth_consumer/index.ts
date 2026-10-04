// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, lazy } from 'react';
import { createExtension } from '../createExtension';

const ConnectedServices = lazy(async () =>
  import('@zephyrex/auth/management/ConnectedServices').then((m) => ({ default: m.ConnectedServices })),
);

// Signing in with an identity provider, and linking more of them to an account: the server's
// /v1/auth/oauth. Its sign-in buttons come from the app's `oauthProviders`; the linked accounts
// are a management tab, shown only where the server runs the extension.
export const oauthConsumerExtension = createExtension('oauth_consumer', {
  displayName: 'OAuth sign-in',
  description: 'Sign in with Google, Microsoft, GitHub, Amazon, Forgejo or any OpenID Connect provider',
  managementTabs: [
    {
      id: 'connected-accounts',
      label: 'Connected Accounts',
      component: () => createElement(ConnectedServices),
      priority: 30,
    },
  ],
});
