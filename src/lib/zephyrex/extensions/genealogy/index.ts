// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const genealogyExtension: ZephyrexClientExtension = {
  name: 'genealogy',
  displayName: 'Genealogy',
  serverExtension: 'genealogy',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Genealogy' }),
};
