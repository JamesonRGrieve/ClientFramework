// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const paymentExtension: ZephyrexClientExtension = {
  name: 'payment',
  displayName: 'Payment & Billing',
  description: 'Stripe integration for subscriptions and payments',
  serverExtension: 'payment',
  // PricingTable renders at /user/subscribe via AuthRouter when
  // NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set.
  navItems: [{ title: 'Billing', url: '/user/subscribe' }],
};
