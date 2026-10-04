// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { ORDERS_PATH, PRODUCTS_PATH, RETURNS_PATH, STORE_PATH } from './routes';

describe('store routes', () => {
  it('puts the orders, products and returns under the stores page', () => {
    expect([STORE_PATH, ORDERS_PATH, PRODUCTS_PATH, RETURNS_PATH]).toEqual([
      '/store',
      '/store/orders',
      '/store/products',
      '/store/returns',
    ]);
  });
});
