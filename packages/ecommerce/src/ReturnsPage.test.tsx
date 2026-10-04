// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReturnsPage } from './ReturnsPage';
import { renderStore } from './testing.mocks';

describe('ReturnsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the returns with the order, refund and reason', async () => {
    const view = renderStore(<ReturnsPage />);
    const list = await view.findByRole('list', { name: 'Returns' });
    expect(list).toHaveTextContent('Return R-1 of order 5001');
    expect(list).toHaveTextContent('21.25 CAD');
    expect(list).toHaveTextContent('Chipped');
  });

  it('says so when there are no returns', async () => {
    const view = renderStore(<ReturnsPage />, { orders: [], products: [], returns: [] });
    expect(await view.findByText('No returns yet.')).toBeInTheDocument();
  });
});
