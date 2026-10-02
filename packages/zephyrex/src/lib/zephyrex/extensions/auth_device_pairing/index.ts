// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// The pairing pages and the welcome page's link ship in @zephyrex/auth-device-pairing, which extends this entry.
export const authDevicePairingExtension = createExtension('auth_device_pairing', {
  displayName: 'Device Pairing',
  description: 'QR code device pairing for cross-device authentication',
});
