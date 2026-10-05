// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionPage } from './SubscriptionPage';
import { renderWebhooks } from './testing.mocks';
import { ORDERS_HOOK_ID, webhooksFixture } from './webhooks.mocks';

const PARAMS = { subscriptionId: ORDERS_HOOK_ID };
const EVENTS = 'Events';

describe('SubscriptionPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the subscription’s settings and its deliveries', async () => {
    const view = renderWebhooks(<SubscriptionPage params={PARAMS} />);
    expect(await view.findByRole('heading', { level: 1, name: 'https://hooks.example.com/orders' })).toBeInTheDocument();
    expect(view.getByLabelText(EVENTS)).toHaveValue('order.created order.refunded');
    expect(await view.findByRole('list', { name: 'Deliveries' })).toBeInTheDocument();
  });

  it('saves only what changed, keeping the secret unless a new one is typed', async () => {
    const store = webhooksFixture();
    const user = userEvent.setup();
    const view = renderWebhooks(<SubscriptionPage params={PARAMS} />, store);
    await user.click(await view.findByLabelText('Deliver events (uncheck to pause)'));
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(await view.findByRole('status')).toHaveTextContent('Saved.');
    expect(store.subscriptions.find(({ id }) => id === ORDERS_HOOK_ID)).toMatchObject({
      active: false,
      secret: 'a-secret-of-sixteen-plus',
    });
  });

  it('keeps the user’s changes beside the subscription as it is now when it changed first', async () => {
    const store = webhooksFixture();
    const user = userEvent.setup();
    const view = renderWebhooks(<SubscriptionPage params={PARAMS} />, store);
    const events = await view.findByLabelText(EVENTS);
    store.subscriptions = store.subscriptions.map((row) =>
      row.id === ORDERS_HOOK_ID ? { ...row, event_types: '*', updated_at: '2026-10-02T08:00:00.000001' } : row,
    );
    await user.clear(events);
    await user.type(events, 'order.paid');
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(await view.findByRole('radio', { name: 'Current: *' })).not.toBeChecked();
  });

  it('removes the subscription and goes back to the webhooks', async () => {
    const store = webhooksFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderWebhooks(<SubscriptionPage params={PARAMS} />, store);
    await user.click(await view.findByRole('button', { name: 'Remove subscription' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/webhooks');
    });
    expect(store.subscriptions.some(({ id }) => id === ORDERS_HOOK_ID)).toBe(false);
  });

  it('says a subscription that isn’t the user’s does not exist for them', async () => {
    const view = renderWebhooks(<SubscriptionPage params={{ subscriptionId: 'gone' }} />);
    expect(await view.findByText(/does not exist or is not yours/)).toBeInTheDocument();
  });
});
