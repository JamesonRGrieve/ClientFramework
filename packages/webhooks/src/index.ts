// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's webhooks extension (zephyrex[webhooks]): the user's outbound
// webhook subscriptions, each guarded by the version the user saw, and what was delivered to them.
export { webhooksExtension } from './extension';
export { WebhooksPage } from './WebhooksPage';
export { SubscriptionPage } from './SubscriptionPage';
export { WEBHOOKS_PATH, subscriptionPagePath } from './routes';
export {
  createSubscription,
  DELIVERY_ENDPOINT,
  DELIVERY_STATUSES,
  DeliverySchema,
  SUBSCRIPTION_ENDPOINT,
  SubscriptionSchema,
  useDeliveries,
  useSubscription,
  useSubscriptionActions,
  useSubscriptions,
} from './webhooksApi';
export type { Delivery, EditableSubscription, NewSubscription, Subscription, SubscriptionActions } from './webhooksApi';
export { generateSecret, MIN_SECRET_LENGTH } from './webhookModel';
