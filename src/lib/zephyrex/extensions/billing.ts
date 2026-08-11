// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const billingExtension: ZephyrexClientExtension = {
  name: 'billing',
  displayName: 'Billing',
  description: 'Subscription billing and pricing tables',
  serverExtension: 'billing',
  navItems: [{ title: 'Billing', url: '/user/subscribe' }],
};
