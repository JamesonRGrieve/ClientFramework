// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const webhooksExtension: ZephyrexClientExtension = {
  name: 'webhooks',
  displayName: 'Webhooks',
  serverExtension: 'webhooks',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Webhooks' }),
};
