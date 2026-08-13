// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import { createExtension } from '../createExtension';

const Notifications = lazy(() =>
  import('@zephyrex/auth/management/Notifications').then((m) => ({ default: m.Notifications })),
);

export const authNotificationsExtension = createExtension('auth_notifications', {
  displayName: 'Notifications',
  description: 'User notification preferences and delivery',
  managementTabs: [{ id: 'notifications', label: 'Notifications', component: () => Notifications({}), priority: 40 }],
  navItems: [{ title: 'Notifications', url: '/notifications' }],
});
