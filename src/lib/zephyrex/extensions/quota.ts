// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const quotaExtension: ZephyrexClientExtension = {
  name: 'quota',
  displayName: 'Quota',
  serverExtension: 'quota',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Quota' }),
};
