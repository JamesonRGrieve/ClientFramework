// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const radiusConsumerExtension: ZephyrexClientExtension = {
  name: 'radius_consumer',
  displayName: 'Radius Consumer',
  serverExtension: 'radius_consumer',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Radius Consumer' }),
};
