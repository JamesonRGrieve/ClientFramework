// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrdersPage } from './OrdersPage';
import { renderStore } from './testing.mocks';

const ORDERS = 'Orders';

describe('OrdersPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the orders newest first, with their totals as written and their lines', async () => {
    const view = renderStore(<OrdersPage />);
    const list = await view.findByRole('list', { name: ORDERS });
    expect(within(list).getAllByRole('listitem').at(0)).toHaveTextContent('Order 9001');
    expect(within(list).getByText('42.50 CAD')).toBeInTheDocument();
    expect(within(list).getByRole('list', { name: 'Lines of order #1001' })).toHaveTextContent('2 × Engine mug');
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    const view = renderStore(<OrdersPage />);
    await view.findByRole('list', { name: ORDERS });
    await user.selectOptions(view.getByLabelText('Status'), 'cancelled');
    expect(within(view.getByRole('list', { name: ORDERS })).getAllByRole('listitem')).toHaveLength(1);
  });

  it('says so when there are no orders', async () => {
    const view = renderStore(<OrdersPage />, { orders: [], products: [], returns: [] });
    expect(await view.findByText('No orders yet.')).toBeInTheDocument();
  });
});
