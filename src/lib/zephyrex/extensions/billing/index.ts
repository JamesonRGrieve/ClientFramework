// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

export const billingExtension = createExtension('billing', {
  description: 'Subscription billing and pricing tables',
  navItems: [{ title: 'Billing', url: '/user/manage' }],
});
