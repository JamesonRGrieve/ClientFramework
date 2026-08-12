// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authSamlExtension: ZephyrexClientExtension = {
  name: 'auth_saml',
  displayName: 'Auth Saml',
  serverExtension: 'auth_saml',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Saml' }),
};
