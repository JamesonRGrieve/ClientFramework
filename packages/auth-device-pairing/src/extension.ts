// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { authDevicePairingExtension as registered } from 'zephyrex/extensions/auth_device_pairing';
import { PairApprove } from './PairApprove';
import { PairRequest } from './PairRequest';

/** Where a signed-out device asks to be signed in; point the server's PAIRING_BASE_URL at `<app><authPath>` + this. */
const PAIR_PATH = '/pair';

/**
 * The auth_device_pairing client extension, for an app's `extensions`: signing in on a new device
 * by scanning its code with one already signed in. It adds the page that shows the code
 * (`<authPath>/pair`), the page the code opens on the signed-in device (`<authPath>/pair/approve`,
 * which needs a session), and the welcome page's link to the first.
 */
export const authDevicePairingExtension: ZephyrexClientExtension = {
  ...registered,
  authPages: [
    { path: PAIR_PATH, component: PairRequest },
    { path: `${PAIR_PATH}/approve`, component: PairApprove, requiresSession: true },
  ],
  signInAlternatives: [{ label: 'Sign in with another device', path: PAIR_PATH }],
};
