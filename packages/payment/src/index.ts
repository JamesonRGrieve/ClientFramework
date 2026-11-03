// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's payment extension (zephyrex[payment]): the subscribe page, where
// the provider's hosted pricing table shows once the app configures one, and a Square card checkout
// for products sold once (the server's entitlements products).
export { paymentExtension } from './extension';
export { STRIPE_PRICING_TABLE_SCRIPT, Subscribe, type StripePricingTable } from './Subscribe';
export { type SquareAccount, squareCspAdditions, type SquareEnvironment, squareScript } from './square';
export {
  formatPrice,
  loadSquareSdk,
  type Product,
  type Purchase,
  type SquareCard,
  SquareCheckout,
  type SquareCheckoutProps,
  type SquareSdk,
} from './SquareCheckout';
