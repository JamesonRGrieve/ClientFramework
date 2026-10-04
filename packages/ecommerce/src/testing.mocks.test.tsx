// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOrders } from './storeApi';
import { renderStore } from './testing.mocks';

function OrderCount(): string {
  return `${String(useOrders().data?.length ?? 0)} orders`;
}

describe('renderStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders under the Zephyrex test app, answering the store routes from the given fixture', async () => {
    const view = renderStore(<OrderCount />);
    expect(await view.findByText('2 orders')).toBeInTheDocument();
  });

  it('serves no orders from an empty fixture', async () => {
    const view = renderStore(<OrderCount />, { orders: [], products: [], returns: [] });
    expect(await view.findByText('0 orders')).toBeInTheDocument();
  });
});
