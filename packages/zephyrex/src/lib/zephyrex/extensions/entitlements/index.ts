// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// What the signed-in user's plan unlocks: the server's /v1/entitlement. Read it with
// `useEntitlement`, and gate a feature with `RequireFeature`.
export const entitlementsExtension = createExtension('entitlements', {
  displayName: 'Entitlements',
  description: 'Plans, features, limits and shared seats, from payment subscriptions',
});
