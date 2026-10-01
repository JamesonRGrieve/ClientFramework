// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, lazy } from 'react';
import { createExtension } from '../createExtension';

const ConnectedServices = lazy(async () =>
  import('@zephyrex/auth/management/ConnectedServices').then((m) => ({ default: m.ConnectedServices })),
);

export const authOauth2ClientExtension = createExtension('auth_oauth2_client', {
  displayName: 'Connected Accounts',
  description: 'Link external accounts (Google, GitHub, Microsoft, …) so agents can act on them',
  managementTabs: [
    {
      id: 'connected-accounts',
      label: 'Connected Accounts',
      component: () => createElement(ConnectedServices),
      priority: 30,
    },
  ],
});
