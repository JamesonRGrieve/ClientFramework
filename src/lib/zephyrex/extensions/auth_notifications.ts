// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const authNotificationsExtension: ZephyrexClientExtension = {
  name: 'auth_notifications',
  displayName: 'Notifications',
  description: 'User notification preferences and delivery',
  serverExtension: 'auth_notifications',
  navItems: [{ title: 'Notifications', url: '/notifications' }],
};
