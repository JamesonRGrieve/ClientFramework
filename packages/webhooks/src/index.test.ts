// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/webhooks', () => {
  it('publishes the pages, the reads and writes behind them, and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'DELIVERY_ENDPOINT',
        'DELIVERY_STATUSES',
        'DeliverySchema',
        'MIN_SECRET_LENGTH',
        'SUBSCRIPTION_ENDPOINT',
        'SubscriptionPage',
        'SubscriptionSchema',
        'WEBHOOKS_PATH',
        'WebhooksPage',
        'createSubscription',
        'generateSecret',
        'subscriptionPagePath',
        'useDeliveries',
        'useSubscription',
        'useSubscriptionActions',
        'useSubscriptions',
        'webhooksExtension',
      ].sort(),
    );
  });
});
