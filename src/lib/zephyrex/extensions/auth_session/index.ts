// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import { createExtension } from '../createExtension';

const ConnectedServices = lazy(() => import('@zephyrex/auth/management/ConnectedServices'));

export const authSessionExtension = createExtension('auth_session', {
  displayName: 'Session Management',
  description: 'Active session tracking and revocation',
  settingsPanel: undefined,
  managementTabs: [{ id: 'sessions', label: 'Active Sessions', component: () => ConnectedServices({}), priority: 20 }],
});
