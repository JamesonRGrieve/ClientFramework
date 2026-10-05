// SPDX-License-Identifier: AGPL-3.0-or-later
/** Where the webhook pages mount in the app (the extension's routes and links). */
export const WEBHOOKS_PATH = '/webhooks';

export const subscriptionPagePath = (subscriptionId: string): string =>
  `${WEBHOOKS_PATH}/${encodeURIComponent(subscriptionId)}`;
