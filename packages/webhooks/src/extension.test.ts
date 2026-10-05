// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { webhooksExtension as registered } from 'zephyrex/extensions';
import { webhooksExtension } from './extension';
import { SubscriptionPage } from './SubscriptionPage';
import { WebhooksPage } from './WebhooksPage';

describe('webhooksExtension', () => {
  it('is the registered webhooks extension, with its pages and a menu entry', () => {
    expect(webhooksExtension).toMatchObject({ name: 'webhooks', serverExtension: 'webhooks' });
    expect(webhooksExtension.description).toBe(registered.description);
    expect(webhooksExtension.pages).toEqual([
      { path: '/webhooks', component: WebhooksPage },
      { path: '/webhooks/:subscriptionId', component: SubscriptionPage },
    ]);
    expect(webhooksExtension.navItems).toEqual([{ title: 'Webhooks', url: '/webhooks' }]);
  });
});
