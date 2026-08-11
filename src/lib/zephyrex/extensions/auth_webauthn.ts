// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authWebauthnExtension: ZephyrexClientExtension = {
  name: 'auth_webauthn',
  displayName: 'Auth Webauthn',
  serverExtension: 'auth_webauthn',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Webauthn' }),
};
