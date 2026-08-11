// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const paymentExtension: ZephyrexClientExtension = {
  name: 'payment',
  displayName: 'Payment',
  serverExtension: 'payment',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Payment' }),
};
