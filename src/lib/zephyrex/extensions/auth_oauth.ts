// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authOauthExtension: ZephyrexClientExtension = {
  name: 'auth_oauth',
  displayName: 'Auth Oauth',
  serverExtension: 'auth_oauth',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Oauth' }),
};
