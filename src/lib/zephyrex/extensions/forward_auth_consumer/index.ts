// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const forwardAuthConsumerExtension: ZephyrexClientExtension = {
  name: 'forward_auth_consumer',
  displayName: 'Forward Auth Consumer',
  serverExtension: 'forward_auth_consumer',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Forward Auth Consumer' }),
};
