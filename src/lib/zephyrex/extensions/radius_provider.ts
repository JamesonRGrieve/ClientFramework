// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const radiusProviderExtension: ZephyrexClientExtension = {
  name: 'radius_provider',
  displayName: 'Radius Provider',
  serverExtension: 'radius_provider',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Radius Provider' }),
};
