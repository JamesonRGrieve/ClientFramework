// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWebhooks } from './testing.mocks';
import { emptyWebhookStore, webhooksFixture } from './webhooks.mocks';
import { WebhooksPage } from './WebhooksPage';

const SUBSCRIBE = 'Subscribe';
const TARGET = 'Deliver to (URL)';
const HOOK_URL = 'https://x.example/h';

describe('WebhooksPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the subscriptions, each linking to its page, delivering or paused', async () => {
    const view = renderWebhooks(<WebhooksPage />);
    const list = await view.findByRole('list', { name: 'Subscriptions' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'https://hooks.example.com/ordersDelivering · order.created order.refunded',
      'https://hooks.example.com/allPaused · *',
    ]);
    expect(within(list).getByRole('link', { name: 'https://hooks.example.com/all' })).toHaveAttribute(
      'href',
      '/webhooks/sub-paused',
    );
  });

  it('subscribes with a generated secret and opens the new subscription', async () => {
    const store = webhooksFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderWebhooks(<WebhooksPage />, store);
    await user.type(view.getByLabelText(TARGET), HOOK_URL);
    await user.click(view.getByRole('button', { name: 'Generate' }));
    await user.click(view.getByRole('button', { name: SUBSCRIBE }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/webhooks/sub-1');
    });
    expect(store.subscriptions.at(-1)).toMatchObject({ target_url: HOOK_URL, event_types: '*', active: true });
    expect(store.subscriptions.at(-1)?.secret).toMatch(/^[\da-f]{64}$/);
  });

  it('says what is wrong before sending anything', async () => {
    const store = webhooksFixture();
    const user = userEvent.setup();
    const view = renderWebhooks(<WebhooksPage />, store);
    const target = view.getByLabelText(TARGET);
    await user.type(target, 'not a url');
    await user.click(view.getByRole('button', { name: SUBSCRIBE }));
    expect(await view.findByRole('alert')).toHaveTextContent('Enter an absolute http(s) address.');
    await user.clear(target);
    await user.type(target, HOOK_URL);
    await user.click(view.getByRole('button', { name: SUBSCRIBE }));
    expect(await view.findByRole('alert')).toHaveTextContent('The secret needs at least 16 characters.');
    expect(store.subscriptions).toHaveLength(2);
  });

  it('says so when there are no subscriptions', async () => {
    const view = renderWebhooks(<WebhooksPage />, emptyWebhookStore());
    expect(await view.findByText('You have no webhook subscriptions yet.')).toBeInTheDocument();
  });
});
