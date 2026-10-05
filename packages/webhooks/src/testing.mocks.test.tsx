// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWebhooks } from './testing.mocks';
import { emptyWebhookStore } from './webhooks.mocks';
import { useSubscriptions } from './webhooksApi';

function SubscriptionCount(): string {
  return `${String(useSubscriptions().data?.length ?? 0)} subscriptions`;
}

describe('renderWebhooks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders under the Zephyrex test app, answering the webhook routes from the given store', async () => {
    const view = renderWebhooks(<SubscriptionCount />);
    expect(await view.findByText('2 subscriptions')).toBeInTheDocument();
  });

  it('serves no subscriptions from an empty store', async () => {
    const view = renderWebhooks(<SubscriptionCount />, emptyWebhookStore());
    expect(await view.findByText('0 subscriptions')).toBeInTheDocument();
  });
});
