// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom } from 'zephyrex/testing/msw';
import { z } from 'zod';
import { FIXTURE_VERSION, ORDERS_HOOK_ID, PAUSED_HOOK_ID, webhookHandlers, webhooksFixture } from './webhooks.mocks';
import { DeliverySchema, SubscriptionSchema } from './webhooksApi';

const BASE = 'http://localhost:1996';
const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;
const HTTP_PRECONDITION_FAILED = 412;
const HTTP_UNPROCESSABLE = 422;
const HTTP_PRECONDITION_REQUIRED = 428;
const LOADED = `"${FIXTURE_VERSION}"`;
const SUBSCRIPTIONS = `${BASE}/v1/webhook-subscription`;
const HOOK_URL = 'https://x.example/h';
const GOOD_SECRET = 'sixteen-chars-ok';

const request = (method: string, body?: object, ifMatch?: string): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  headers: ifMatch === undefined ? {} : { 'If-Match': ifMatch },
});
const SubscriptionBodySchema = z.object({ webhook_subscription: SubscriptionSchema });
const DeliveriesBodySchema = z.object({ webhook_deliveries: z.array(DeliverySchema) });

describe('the mock webhooks server', () => {
  it('never returns a subscription’s secret', async () => {
    const serve = fetchFrom(webhookHandlers());
    const listed = await (await serve(SUBSCRIPTIONS)).text();
    const one = await (await serve(`${SUBSCRIPTIONS}/${ORDERS_HOOK_ID}`)).text();
    expect(listed).not.toContain('secret');
    expect(one).not.toContain('secret');
    expect((await serve(`${SUBSCRIPTIONS}/gone`)).status).toBe(HTTP_NOT_FOUND);
  });

  it('subscribes with checked fields, normalising the event types', async () => {
    const store = webhooksFixture();
    const serve = fetchFrom(webhookHandlers(store));
    const subscribe = async (fields: object): Promise<Response> =>
      serve(SUBSCRIPTIONS, request('POST', { webhook_subscription: fields }));
    const made = await subscribe({ target_url: HOOK_URL, event_types: 'a,b', secret: GOOD_SECRET });
    expect(made.status).toBe(HTTP_CREATED);
    expect(SubscriptionBodySchema.parse(await made.json()).webhook_subscription.event_types).toBe('a b');
    expect(store.subscriptions.at(-1)?.secret).toBe(GOOD_SECRET);
    expect((await subscribe({ target_url: HOOK_URL, secret: 'short' })).status).toBe(HTTP_UNPROCESSABLE);
    expect((await subscribe({ target_url: 'ftp://x.example', secret: GOOD_SECRET })).status).toBe(HTTP_UNPROCESSABLE);
  });

  it('holds a change to its version: 428 without one, 412 for an older one', async () => {
    const store = webhooksFixture();
    const serve = fetchFrom(webhookHandlers(store));
    const pause = { webhook_subscription: { active: false } };
    const url = `${SUBSCRIPTIONS}/${ORDERS_HOOK_ID}`;
    expect((await serve(url, request('PUT', pause))).status).toBe(HTTP_PRECONDITION_REQUIRED);
    expect((await serve(url, request('PUT', pause, LOADED))).status).toBe(HTTP_OK);
    const stale = await serve(url, request('PUT', pause, LOADED));
    expect(stale.status).toBe(HTTP_PRECONDITION_FAILED);
    expect(await stale.text()).not.toContain('secret');
    expect(store.subscriptions.find(({ id }) => id === ORDERS_HOOK_ID)?.active).toBe(false);
  });

  it('shows a subscription’s deliveries, and none of a removed one', async () => {
    const store = webhooksFixture();
    const serve = fetchFrom(webhookHandlers(store));
    const deliveries = async (id: string): Promise<string[]> =>
      DeliveriesBodySchema.parse(
        await (await serve(`${BASE}/v1/webhook-delivery?webhook_subscription_id=${id}`)).json(),
      ).webhook_deliveries.map((row) => row.id);
    expect(await deliveries(ORDERS_HOOK_ID)).toEqual(['d1', 'd2', 'd3']);
    expect(await deliveries(PAUSED_HOOK_ID)).toEqual([]);
    await serve(`${SUBSCRIPTIONS}/${ORDERS_HOOK_ID}`, request('DELETE', undefined, LOADED));
    expect(await deliveries(ORDERS_HOOK_ID)).toEqual([]);
  });
});
