// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const metaLabelsExtension: ZephyrexClientExtension = {
  name: 'meta_labels',
  displayName: 'Meta Labels',
  serverExtension: 'meta_labels',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Meta Labels' }),
};
