// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, lazy } from 'react';
import { createExtension } from '../createExtension';

const Sessions = lazy(async () => import('@zephyrex/auth/management/Sessions').then((m) => ({ default: m.Sessions })));

export const authSessionExtension = createExtension('auth_session', {
  displayName: 'Session Management',
  description: 'Active session tracking and revocation',
  managementTabs: [{ id: 'sessions', label: 'Active Sessions', component: () => createElement(Sessions), priority: 20 }],
});
