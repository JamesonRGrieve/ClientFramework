// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const privacyExtension: ZephyrexClientExtension = {
  name: 'privacy',
  displayName: 'Privacy',
  serverExtension: 'privacy',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Privacy' }),
};
