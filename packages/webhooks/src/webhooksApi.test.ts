// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import {
  FIXTURE_VERSION,
  ORDERS_HOOK_ID,
  PAUSED_HOOK_ID,
  subscriptionOf,
  webhookHandlers,
  webhooksFixture,
} from './webhooks.mocks';
import { createSubscription, useDeliveries, useSubscription, useSubscriptionActions, useSubscriptions } from './webhooksApi';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

describe('the webhooks API', () => {
  let store = webhooksFixture();
  let calls: { url: string; init: RequestInit | undefined }[] = [];

  beforeEach(() => {
    store = webhooksFixture();
    calls = [];
    const answer = fetchFrom(webhookHandlers(store));
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: URL | string, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        return answer(input, init);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the subscriptions, one subscription or null, and a subscription’s deliveries newest first', async () => {
    const all = renderHook(() => useSubscriptions(), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(all.current.data?.map(({ id }) => id)).toEqual([ORDERS_HOOK_ID, PAUSED_HOOK_ID]);
    });
    const gone = renderHook(() => useSubscription('gone'), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(gone.current.data).toBeNull();
    });
    const deliveries = renderHook(() => useDeliveries(ORDERS_HOOK_ID), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(deliveries.current.data?.map(({ id }) => id)).toEqual(['d2', 'd1', 'd3']);
    });
  });

  it('subscribes, and guards each change and the removal by the subscription as loaded', async () => {
    await createSubscription(client, {
      target_url: 'https://x.example/h',
      event_types: '*',
      secret: 'sixteen-chars-ok',
      active: true,
    });
    const { result } = renderHook(() => useSubscriptionActions(ORDERS_HOOK_ID), { wrapper: TestWrapper });
    const loaded = subscriptionOf(store, ORDERS_HOOK_ID);
    await expect(result.current.update.save(loaded, { active: false, secret: 'a-brand-new-secret' })).resolves.toBe(true);
    const changed = subscriptionOf(store, ORDERS_HOOK_ID);
    await expect(result.current.remove.save(changed, {})).resolves.toBe(true);
    const writes = calls
      .filter(({ init }) => (init?.method ?? 'GET') !== 'GET')
      .map(({ url, init }) => [init?.method, new URL(url).pathname, init?.body, new Headers(init?.headers).get('If-Match')]);
    expect(writes).toEqual([
      [
        'POST',
        '/v1/webhook-subscription',
        '{"webhook_subscription":{"target_url":"https://x.example/h","event_types":"*","secret":"sixteen-chars-ok","active":true}}',
        null,
      ],
      [
        'PUT',
        `/v1/webhook-subscription/${ORDERS_HOOK_ID}`,
        '{"webhook_subscription":{"active":false,"secret":"a-brand-new-secret"}}',
        `"${FIXTURE_VERSION}"`,
      ],
      ['DELETE', `/v1/webhook-subscription/${ORDERS_HOOK_ID}`, undefined, `"${changed.updated_at ?? ''}"`],
    ]);
  });

  it('keeps a stale change as a conflict beside the subscription as it is now', async () => {
    const loaded = subscriptionOf(store, ORDERS_HOOK_ID);
    store.subscriptions = store.subscriptions.map((row) =>
      row.id === ORDERS_HOOK_ID ? { ...row, event_types: '*', updated_at: '2026-10-02T08:00:00.000001' } : row,
    );
    const { result } = renderHook(() => useSubscriptionActions(ORDERS_HOOK_ID), { wrapper: TestWrapper });
    await expect(result.current.update.save(loaded, { active: false })).resolves.toBe(false);
    await waitFor(() => {
      expect(result.current.update.conflict?.theirs?.event_types).toBe('*');
    });
  });
});
