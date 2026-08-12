// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const samlConsumerExtension: ZephyrexClientExtension = {
  name: 'saml_consumer',
  displayName: 'Saml Consumer',
  serverExtension: 'saml_consumer',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Saml Consumer' }),
};
