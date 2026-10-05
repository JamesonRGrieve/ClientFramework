// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory webhooks server for the package's tests and stories (never compiled into dist): the
// user's subscriptions (checked as the server checks them, each change held to its version, the
// secret never returned) and the deliveries the server queued and sent for them.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { notFound, refuseStale, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import { draftProblem, normalisedEventTypes } from './webhookModel';
import {
  type Delivery,
  DELIVERY_ENDPOINT,
  SUBSCRIPTION_ENDPOINT,
  type Subscription,
  SubscriptionSchema,
} from './webhooksApi';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_UNPROCESSABLE = 422;

/** When the fixture's rows were recorded: their version until a test or story changes one. */
export const FIXTURE_VERSION = '2026-10-01T09:00:00.000001';
const ME_ID = 'u-me';
export const ORDERS_HOOK_ID = 'sub-orders';
export const PAUSED_HOOK_ID = 'sub-paused';
/** A delivery still being retried has failed this often. */
const RETRYING_ATTEMPTS = 2;
/** The server gives a delivery up after this many failed sends. */
const SERVER_MAX_ATTEMPTS = 5;

/** A stored subscription with the secret the server keeps (encrypted there) beside it. */
interface StoredSubscription extends Subscription {
  secret: string;
}

export interface WebhookStore {
  subscriptions: StoredSubscription[];
  deliveries: Delivery[];
}

const subscription = (id: string, url: string, events: string, active: boolean): StoredSubscription => ({
  id,
  user_id: ME_ID,
  target_url: url,
  event_types: events,
  active,
  secret: 'a-secret-of-sixteen-plus',
  created_at: FIXTURE_VERSION,
  updated_at: null,
});

const delivery = (id: string, status: Delivery['status'], attempts: number, extra: Partial<Delivery>): Delivery => ({
  id,
  webhook_subscription_id: ORDERS_HOOK_ID,
  event_type: 'order.created',
  payload: `{"event":"order.created","id":"${id}"}`,
  status,
  attempts,
  next_attempt_at: '2026-10-01T10:00:00',
  last_error: null,
  delivered_at: null,
  created_at: FIXTURE_VERSION,
  updated_at: null,
  ...extra,
});

/** An active subscription with three deliveries (sent, retrying, given up), and a paused one with none. */
export function webhooksFixture(): WebhookStore {
  return {
    subscriptions: [
      subscription(ORDERS_HOOK_ID, 'https://hooks.example.com/orders', 'order.created order.refunded', true),
      subscription(PAUSED_HOOK_ID, 'https://hooks.example.com/all', '*', false),
    ],
    deliveries: [
      delivery('d1', 'delivered', 1, { delivered_at: '2026-10-01T09:00:02', created_at: '2026-10-01T09:00:01' }),
      delivery('d2', 'pending', RETRYING_ATTEMPTS, {
        last_error: 'HTTP 503 from the receiver',
        next_attempt_at: '2026-10-01T09:10:00',
        created_at: '2026-10-01T09:05:00',
      }),
      delivery('d3', 'dead', SERVER_MAX_ATTEMPTS, { last_error: 'Connection refused', created_at: '2026-10-01T08:00:00' }),
    ],
  };
}

/** A store with nothing in it. */
export const emptyWebhookStore = (): WebhookStore => ({ subscriptions: [], deliveries: [] });

/** The delivery `id` of `store`; a test or story naming one that isn't there is a mistake in it. */
export function deliveryOf(store: WebhookStore, id: string): Delivery {
  const found = store.deliveries.find((row) => row.id === id);
  if (found === undefined) {
    throw new Error(`No delivery ${id} in the fixture`);
  }
  return found;
}

/** A subscription as the server shows it: never with its secret (the schema has none, so drops it). */
const withoutSecret = (row: StoredSubscription): Subscription => SubscriptionSchema.parse(row);

/** The subscription `id` of `store`; a test or story naming one that isn't there is a mistake in it. */
export function subscriptionOf(store: WebhookStore, id: string): Subscription {
  const found = store.subscriptions.find((row) => row.id === id);
  if (found === undefined) {
    throw new Error(`No subscription ${id} in the fixture`);
  }
  return withoutSecret(found);
}

const SubscriptionFieldsSchema = z.object({
  target_url: z.string(),
  event_types: z.string(),
  secret: z.string(),
  active: z.boolean(),
});
const SubscriptionBodySchema = z.object({ webhook_subscription: SubscriptionFieldsSchema.partial() });
/** A new subscription's body, with the server's defaults for what it leaves out. */
const NewSubscriptionBodySchema = z.object({
  webhook_subscription: SubscriptionFieldsSchema.extend({
    target_url: z.string().default(''),
    event_types: z.string().default('*'),
    secret: z.string().default(''),
    active: z.boolean().default(true),
  }),
});

const refuse = (detail: string): Response => HttpResponse.json({ detail }, { status: HTTP_UNPROCESSABLE });

/** The webhook routes over `store`, as the signed-in user sees them. */
export function webhookHandlers(store: WebhookStore = webhooksFixture()): RequestHandler[] {
  let created = 0;
  const mine = (id: string | readonly string[] | undefined): StoredSubscription | undefined =>
    store.subscriptions.find((row) => row.id === id && row.user_id === ME_ID);

  return [
    http.get(`*${SUBSCRIPTION_ENDPOINT}`, () =>
      HttpResponse.json({
        webhook_subscriptions: store.subscriptions.filter((row) => row.user_id === ME_ID).map(withoutSecret),
      }),
    ),
    http.get(`*${SUBSCRIPTION_ENDPOINT}/:id`, ({ params: { id } }) => {
      const found = mine(id);
      return found === undefined ? notFound() : HttpResponse.json({ webhook_subscription: withoutSecret(found) });
    }),
    http.post(`*${SUBSCRIPTION_ENDPOINT}`, async ({ request }) => {
      const { webhook_subscription: draft } = NewSubscriptionBodySchema.parse(await request.json());
      const problem = draftProblem(draft, true);
      if (problem !== null) {
        return refuse(problem);
      }
      created += 1;
      const row: StoredSubscription = {
        ...subscription(`sub-${String(created)}`, draft.target_url, normalisedEventTypes(draft.event_types), draft.active),
        secret: draft.secret,
        created_at: versionStamp(),
      };
      store.subscriptions.push(row);
      return HttpResponse.json({ webhook_subscription: withoutSecret(row) }, { status: HTTP_CREATED });
    }),
    http.put(`*${SUBSCRIPTION_ENDPOINT}/:id`, async ({ params: { id }, request }) => {
      const current = mine(id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, withoutSecret(current));
      if (refused !== null) {
        return refused;
      }
      const { webhook_subscription: fields } = SubscriptionBodySchema.parse(await request.json());
      const next = {
        target_url: fields.target_url ?? current.target_url,
        event_types: fields.event_types ?? current.event_types,
        active: fields.active ?? current.active,
        secret: fields.secret ?? '',
      };
      const problem = draftProblem(next, false);
      if (problem !== null) {
        return refuse(problem);
      }
      const updated: StoredSubscription = {
        ...current,
        ...next,
        event_types: normalisedEventTypes(next.event_types),
        secret: next.secret === '' ? current.secret : next.secret,
        updated_at: versionStamp(),
      };
      store.subscriptions = store.subscriptions.map((row) => (row.id === current.id ? updated : row));
      return HttpResponse.json({ webhook_subscription: withoutSecret(updated) });
    }),
    http.delete(`*${SUBSCRIPTION_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = mine(id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, withoutSecret(current));
      if (refused !== null) {
        return refused;
      }
      store.subscriptions = store.subscriptions.filter((row) => row.id !== current.id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
    http.get(`*${DELIVERY_ENDPOINT}`, ({ request }) => {
      const subscriptionId = new URL(request.url).searchParams.get('webhook_subscription_id');
      return HttpResponse.json({
        webhook_deliveries: store.deliveries.filter(
          (row) =>
            mine(row.webhook_subscription_id) !== undefined &&
            (subscriptionId === null || row.webhook_subscription_id === subscriptionId),
        ),
      });
    }),
  ];
}
