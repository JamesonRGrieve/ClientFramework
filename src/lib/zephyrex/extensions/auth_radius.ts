// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authRadiusExtension: ZephyrexClientExtension = {
  name: 'auth_radius',
  displayName: 'Auth Radius',
  serverExtension: 'auth_radius',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Radius' }),
};
