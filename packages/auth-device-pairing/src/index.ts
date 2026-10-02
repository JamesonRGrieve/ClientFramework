// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's auth_device_pairing extension (zephyrex[auth-device-pairing]):
// a new device shows a code, a device already signed in scans it and approves, and the new device
// is signed in. Both pages are auth pages, mounted by the extension under the app's auth path.
export { authDevicePairingExtension } from './extension';
export { PairApprove } from './PairApprove';
export { PAIRING_POLL_MS, PairRequest } from './PairRequest';
export { answerPairing, PAIRING_ENDPOINT, pairingStatus, requestPairing } from './pairingApi';
export type { PairingAnswer, PairingDecision, PairingStart, PairingState } from './pairingApi';
