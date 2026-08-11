// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const rpgLogExtension: ZephyrexClientExtension = {
  name: 'rpg_log',
  displayName: 'Rpg Log',
  serverExtension: 'rpg_log',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Rpg Log' }),
};
