// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { webauthnConsumerExtension as registered } from 'zephyrex/extensions';
import { Passkeys } from './Passkeys';

const PASSKEYS_PRIORITY = 20;

/**
 * The webauthn_consumer client extension, for an app's `extensions`: it turns on passkey sign-in
 * on the auth pages (where the browser supports it) and adds the account page's Passkeys section.
 */
export const webauthnConsumerExtension: ZephyrexClientExtension = {
  ...registered,
  authModes: { passkey: true },
  managementTabs: [{ id: 'passkeys', label: 'Passkeys', component: Passkeys, priority: PASSKEYS_PRIORITY }],
};
