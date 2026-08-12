// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const billingExtension: ZephyrexClientExtension = {
  name: 'billing',
  displayName: 'Billing',
  description: 'Subscription billing and pricing tables',
  serverExtension: 'billing',
  // Shares UI with payment extension — PricingTable
  navItems: [{ title: 'Billing', url: '/user/manage' }],
};
