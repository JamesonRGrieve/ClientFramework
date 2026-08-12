// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const metadataExtension: ZephyrexClientExtension = {
  name: 'metadata',
  displayName: 'Metadata',
  serverExtension: 'metadata',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Metadata' }),
};
