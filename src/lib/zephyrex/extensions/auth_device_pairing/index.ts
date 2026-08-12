// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const authDevicePairingExtension: ZephyrexClientExtension = {
  name: 'auth_device_pairing',
  displayName: 'Device Pairing',
  description: 'QR code device pairing for cross-device authentication',
  serverExtension: 'auth_device_pairing',
};
