// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// The notification inbox is the app's own page (/notifications), on zephyrex's notification hooks.
export const authNotificationsExtension = createExtension('auth_notifications', {
  displayName: 'Notifications',
  description: 'User notification preferences and delivery',
  navItems: [{ title: 'Notifications', url: '/notifications' }],
});
