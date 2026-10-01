// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

export const authDevicePairingExtension = createExtension('auth_device_pairing', {
  displayName: 'Device Pairing',
  description: 'QR code device pairing for cross-device authentication',
});
