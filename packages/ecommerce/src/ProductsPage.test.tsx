// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductsPage } from './ProductsPage';
import { renderStore } from './testing.mocks';

describe('ProductsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the products by title, linking only to web pages', async () => {
    const view = renderStore(<ProductsPage />);
    const list = await view.findByRole('list', { name: 'Products' });
    expect(within(list).getByRole('link', { name: 'Engine mug' })).toHaveAttribute(
      'href',
      'https://shop.example.com/products/engine-mug',
    );
    expect(within(list).queryByRole('link', { name: 'Punch-card print' })).toBeNull();
    expect(within(list).getByText('Punch-card print')).toBeInTheDocument();
    expect(within(list).getByText('14 in stock')).toBeInTheDocument();
    expect(within(list).getByText('Not listed')).toBeInTheDocument();
  });

  it('says so when there are no products', async () => {
    const view = renderStore(<ProductsPage />, { orders: [], products: [], returns: [] });
    expect(await view.findByText('No products yet.')).toBeInTheDocument();
  });
});
