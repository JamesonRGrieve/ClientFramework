// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const rpgStateExtension: ZephyrexClientExtension = {
  name: 'rpg_state',
  displayName: 'Rpg State',
  serverExtension: 'rpg_state',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Rpg State' }),
};
