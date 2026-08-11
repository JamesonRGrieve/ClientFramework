// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const oidcConsumerExtension: ZephyrexClientExtension = {
  name: 'oidc_consumer',
  displayName: 'Oidc Consumer',
  serverExtension: 'oidc_consumer',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Oidc Consumer' }),
};
