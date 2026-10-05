// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Deliveries, deliveryProgress } from './Deliveries';
import { renderWebhooks } from './testing.mocks';
import { deliveryOf, emptyWebhookStore, ORDERS_HOOK_ID, webhooksFixture } from './webhooks.mocks';

describe('deliveryProgress', () => {
  const [sent, retrying, dead] = webhooksFixture().deliveries.map(deliveryProgress);

  it('says when a delivery was accepted, when it is tried next, or that it was given up on', () => {
    expect(sent).toBe(`Delivered ${new Date('2026-10-01T09:00:02Z').toLocaleString()} · 1 attempt`);
    expect(retrying).toBe(`2 attempts; next try ${new Date('2026-10-01T09:10:00Z').toLocaleString()}`);
    expect(dead).toBe('Gave up after 5 attempts');
  });

  it('calls a delivery not yet tried queued', () => {
    const sentOne = deliveryOf(webhooksFixture(), 'd1');
    expect(deliveryProgress({ ...sentOne, status: 'pending', attempts: 0 })).toBe('Queued');
  });
});

describe('Deliveries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the deliveries newest first, with why a failing one failed and what was sent', async () => {
    const view = renderWebhooks(<Deliveries subscriptionId={ORDERS_HOOK_ID} />);
    const list = await view.findByRole('list', { name: 'Deliveries' });
    const items = within(list)
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(items).toHaveLength(3);
    expect(items[0]).toContain('Pending');
    expect(items[0]).toContain('Last error: HTTP 503 from the receiver');
    expect(items[1]).toContain('Delivered');
    expect(items[1]).not.toContain('Last error');
    expect(items[2]).toContain('Gave up');
    expect(items[2]).toContain('{"event":"order.created","id":"d3"}');
  });

  it('says so when nothing has been sent', async () => {
    const view = renderWebhooks(<Deliveries subscriptionId={ORDERS_HOOK_ID} />, emptyWebhookStore());
    expect(await view.findByText('Nothing has been sent yet.')).toBeInTheDocument();
  });
});
