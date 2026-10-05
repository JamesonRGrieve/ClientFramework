// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { ApiError, type GuardedSave, serverInstant, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const SUBSCRIPTION_ENDPOINT = '/v1/webhook-subscription';
export const DELIVERY_ENDPOINT = '/v1/webhook-delivery';

const HTTP_NOT_FOUND = 404;
/** How often a subscription's deliveries are read again: they move on in the background. */
const DELIVERY_REFRESH_MS = 10_000;

const optionalText = z.string().nullable().optional();

/**
 * An endpoint the user has events delivered to. Its signing secret is write-only: the server never
 * returns it.
 */
export const SubscriptionSchema = z.object({
  id: z.string(),
  user_id: optionalText,
  target_url: z.string(),
  /** Space-separated; `*` for every event. */
  event_types: z.string(),
  active: z.boolean(),
  // The row's version, sent back verbatim as If-Match on every change.
  created_at: optionalText,
  updated_at: optionalText,
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const DELIVERY_STATUSES = ['pending', 'delivered', 'dead'] as const;

/** One event queued for, or sent to, a subscription. Only the server writes it. */
export const DeliverySchema = z.object({
  id: z.string(),
  webhook_subscription_id: z.string(),
  event_type: z.string(),
  /** The JSON body POSTed, exactly as signed. */
  payload: z.string(),
  status: z.enum(DELIVERY_STATUSES),
  attempts: z.number().int(),
  next_attempt_at: optionalText,
  last_error: optionalText,
  delivered_at: optionalText,
  created_at: optionalText,
  updated_at: optionalText,
});
export type Delivery = z.infer<typeof DeliverySchema>;

/** What a new subscription is made from. */
export interface NewSubscription {
  target_url: string;
  event_types: string;
  secret: string;
  active: boolean;
}

/** A subscription as it is edited: a new secret may be set, though none is ever read back. */
const EditableSubscriptionSchema = SubscriptionSchema.extend({ secret: z.string().optional() });
export type EditableSubscription = z.infer<typeof EditableSubscriptionSchema>;

const SubscriptionEnvelopeSchema = z.object({ webhook_subscription: SubscriptionSchema });

const subscriptionPath = (id: string): string => `${SUBSCRIPTION_ENDPOINT}/${encodeURIComponent(id)}`;
/** Where a delivery with no timestamp sorts: after every other. */
const NO_TIME = '1970-01-01T00:00:00';
const queuedAt = ({ created_at: created, next_attempt_at: next }: Delivery): number =>
  serverInstant(created ?? next ?? NO_TIME).getTime();
const newestFirst = (a: Delivery, b: Delivery): number => queuedAt(b) - queuedAt(a);

/** The user's subscriptions. */
export function useSubscriptions(): SWRResponse<Subscription[], Error> {
  const client = useClient();
  return useSWR<Subscription[], Error>(client.url(SUBSCRIPTION_ENDPOINT), async () =>
    client.list(SUBSCRIPTION_ENDPOINT, 'webhook_subscriptions', SubscriptionSchema),
  );
}

/** One subscription, or `null` when it doesn't exist or isn't the user's (the server answers 404 for both). */
export function useSubscription(id: string): SWRResponse<Subscription | null, Error> {
  const client = useClient();
  return useSWR<Subscription | null, Error>(client.url(subscriptionPath(id)), async () => {
    try {
      return SubscriptionEnvelopeSchema.parse(await client.get(subscriptionPath(id))).webhook_subscription;
    } catch (error) {
      if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  });
}

/** A subscription's deliveries, newest first, read again every few seconds. */
export function useDeliveries(subscriptionId: string): SWRResponse<Delivery[], Error> {
  const client = useClient();
  const params = { webhook_subscription_id: subscriptionId };
  return useSWR<Delivery[], Error>(
    client.url(DELIVERY_ENDPOINT, params),
    async () => (await client.list(DELIVERY_ENDPOINT, 'webhook_deliveries', DeliverySchema, params)).sort(newestFirst),
    { refreshInterval: DELIVERY_REFRESH_MS },
  );
}

/** Subscribes the user; resolves to what the server stored (without the secret). */
export async function createSubscription(client: ZephyrexClient, subscription: NewSubscription): Promise<Subscription> {
  // Spread to a plain object: an interface isn't known to fit a JSON body, its copy is.
  const body = { webhook_subscription: { ...subscription } };
  return SubscriptionEnvelopeSchema.parse(await client.post(SUBSCRIPTION_ENDPOINT, body)).webhook_subscription;
}

export interface SubscriptionActions {
  /** `update.save(subscription, changes)`: change it (a new secret too), guarded by it as loaded. */
  update: GuardedSave<EditableSubscription>;
  /** `remove.save(subscription, {})`: unsubscribe, guarded by it as loaded. */
  remove: GuardedSave<Subscription>;
}

/** The writes to subscription `id`, each refreshing the subscriptions (and the subscription) shown. */
export function useSubscriptionActions(id: string): SubscriptionActions {
  const client = useClient();
  const { mutate: refreshSubscriptions } = useSubscriptions();
  const { mutate: refreshSubscription } = useSubscription(id);
  const update = useCallback(
    async (seen: EditableSubscription, changes: Partial<EditableSubscription>): Promise<void> => {
      await client.put(subscriptionPath(seen.id), { webhook_subscription: changes }, seen);
      await Promise.all([refreshSubscriptions(), refreshSubscription()]);
    },
    [client, refreshSubscriptions, refreshSubscription],
  );
  const remove = useCallback(
    async (seen: Subscription): Promise<void> => {
      await client.delete(subscriptionPath(seen.id), seen);
      await refreshSubscriptions();
    },
    [client, refreshSubscriptions],
  );
  return {
    update: useGuardedSave(update, EditableSubscriptionSchema),
    remove: useGuardedSave(remove, SubscriptionSchema),
  };
}
