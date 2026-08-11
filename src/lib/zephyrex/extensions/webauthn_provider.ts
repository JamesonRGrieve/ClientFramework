// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const webauthnProviderExtension: ZephyrexClientExtension = {
  name: 'webauthn_provider',
  displayName: 'Webauthn Provider',
  serverExtension: 'webauthn_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Webauthn Provider' }),
};
