// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authDevicePairingExtension: ZephyrexClientExtension = {
  name: 'auth_device_pairing',
  displayName: 'Auth Device Pairing',
  serverExtension: 'auth_device_pairing',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Device Pairing' }),
};
