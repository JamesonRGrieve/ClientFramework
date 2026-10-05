// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// @zephyrex/webhooks extends this with the pages for the user's subscriptions and their deliveries.
export const webhooksExtension = createExtension('webhooks', {
  description: 'Outbound webhooks: signed deliveries of your events to the endpoints you subscribe',
});
