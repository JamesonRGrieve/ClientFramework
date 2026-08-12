// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const scimConsumerExtension: ZephyrexClientExtension = {
  name: 'scim_consumer',
  displayName: 'Scim Consumer',
  serverExtension: 'scim_consumer',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Scim Consumer' }),
};
