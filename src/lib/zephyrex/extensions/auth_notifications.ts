// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authNotificationsExtension: ZephyrexClientExtension = {
  name: 'auth_notifications',
  displayName: 'Auth Notifications',
  serverExtension: 'auth_notifications',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Notifications' }),
};
