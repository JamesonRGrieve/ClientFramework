// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authSessionExtension: ZephyrexClientExtension = {
  name: 'auth_session',
  displayName: 'Auth Session',
  serverExtension: 'auth_session',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Session' }),
};
