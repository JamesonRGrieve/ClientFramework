// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const metaLabelsExtension: ZephyrexClientExtension = {
  name: 'meta_labels',
  displayName: 'Labels',
  description: 'Tag and label management for entities',
  serverExtension: 'meta_labels',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Labels' }),
};
