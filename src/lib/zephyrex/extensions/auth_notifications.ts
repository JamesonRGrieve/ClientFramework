// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import type { ZephyrexClientExtension } from '../types';

const Notifications = lazy(() => import('@zephyrex/auth/management/Notifications'));

export const authNotificationsExtension: ZephyrexClientExtension = {
  name: 'auth_notifications',
  displayName: 'Notifications',
  description: 'User notification preferences and delivery',
  serverExtension: 'auth_notifications',
  managementTabs: [
    { id: 'notifications', label: 'Notifications', component: () => Notifications({}), priority: 40 },
  ],
  navItems: [{ title: 'Notifications', url: '/notifications' }],
};
