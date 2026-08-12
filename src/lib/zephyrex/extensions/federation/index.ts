// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const federationExtension: ZephyrexClientExtension = {
  name: 'federation',
  displayName: 'Federation',
  serverExtension: 'federation',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Federation' }),
};
