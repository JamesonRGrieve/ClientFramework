// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const billingExtension: ZephyrexClientExtension = {
  name: 'billing',
  displayName: 'Billing',
  serverExtension: 'billing',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Billing' }),
};
