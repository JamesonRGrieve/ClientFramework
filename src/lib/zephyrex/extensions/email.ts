// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const emailExtension: ZephyrexClientExtension = {
  name: 'email',
  displayName: 'Email',
  serverExtension: 'email',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Email' }),
};
