// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's payment extension (zephyrex[payment]): the subscribe page, where
// the provider's hosted pricing table shows once the app configures one. Plans and checkout live
// with the payment provider, through the server's federation.
export { paymentExtension } from './extension';
export { STRIPE_PRICING_TABLE_SCRIPT, Subscribe, type StripePricingTable } from './Subscribe';
