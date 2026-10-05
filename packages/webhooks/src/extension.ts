// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { webhooksExtension as registered } from 'zephyrex/extensions';
import { WEBHOOKS_PATH } from './routes';
import { SubscriptionPage } from './SubscriptionPage';
import { WebhooksPage } from './WebhooksPage';

/** The webhooks client extension with its pages and menu entry, for an app's `extensions`. */
export const webhooksExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: WEBHOOKS_PATH, component: WebhooksPage },
    { path: `${WEBHOOKS_PATH}/:subscriptionId`, component: SubscriptionPage },
  ],
  navItems: [{ title: 'Webhooks', url: WEBHOOKS_PATH }],
};
