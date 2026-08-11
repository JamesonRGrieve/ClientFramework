// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import type { ZephyrexClientExtension } from '../types';

const PricingTable = lazy(() => import('@zephyrex/auth/Stripe/PricingTable'));

export const paymentExtension: ZephyrexClientExtension = {
  name: 'payment',
  displayName: 'Payment & Billing',
  description: 'Stripe integration for subscriptions and payments',
  serverExtension: 'payment',
  managementTabs: [
    { id: 'billing', label: 'Billing', component: () => PricingTable({}), priority: 50 },
  ],
  navItems: [{ title: 'Billing', url: '/user/manage' }],
};
