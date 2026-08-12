// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const webauthnConsumerExtension: ZephyrexClientExtension = {
  name: 'webauthn_consumer',
  displayName: 'Webauthn Consumer',
  serverExtension: 'webauthn_consumer',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Webauthn Consumer' }),
};
