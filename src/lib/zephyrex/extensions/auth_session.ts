// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import type { ZephyrexClientExtension } from '../types';

const ConnectedServices = lazy(() => import('@zephyrex/auth/management/ConnectedServices'));

export const authSessionExtension: ZephyrexClientExtension = {
  name: 'auth_session',
  displayName: 'Session Management',
  description: 'Active session tracking and revocation',
  serverExtension: 'auth_session',
  managementTabs: [
    { id: 'sessions', label: 'Active Sessions', component: () => ConnectedServices({}), priority: 20 },
  ],
};
