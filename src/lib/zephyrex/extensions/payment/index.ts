// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import { createExtension } from '../createExtension';

const PricingTable = lazy(() => import('@zephyrex/auth/Stripe/PricingTable'));

export const paymentExtension = createExtension('payment', {
  displayName: 'Payment & Billing',
  description: 'Stripe integration for subscriptions and payments',
  settingsPanel: undefined,
  managementTabs: [{ id: 'billing', label: 'Billing', component: () => PricingTable({}), priority: 50 }],
  navItems: [{ title: 'Billing', url: '/user/manage' }],
});
