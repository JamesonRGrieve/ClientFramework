// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const fileioExtension: ZephyrexClientExtension = {
  name: 'fileio',
  displayName: 'File Storage',
  description: 'File upload and object storage',
  serverExtension: 'fileio',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'File Storage' }),
};
