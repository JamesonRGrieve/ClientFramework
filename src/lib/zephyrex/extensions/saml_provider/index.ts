// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const samlProviderExtension: ZephyrexClientExtension = {
  name: 'saml_provider',
  displayName: 'Saml Provider',
  serverExtension: 'saml_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Saml Provider' }),
};
