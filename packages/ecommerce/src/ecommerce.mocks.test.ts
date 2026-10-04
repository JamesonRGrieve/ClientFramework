// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom } from 'zephyrex/testing/msw';
import { ecommerceHandlers, storeFixture } from './ecommerce.mocks';
import { OrderSchema, ProductSchema, ReturnSchema } from './storeApi';

const BASE = 'http://localhost:1996';
const HTTP_NOT_FOUND = 404;

describe('the mock e-commerce server', () => {
  it('holds records the client reads as the server sends them', () => {
    const { orders, products, returns } = storeFixture();
    expect(orders.map((row) => OrderSchema.parse(row))).toEqual(orders);
    expect(products.map((row) => ProductSchema.parse(row))).toEqual(products);
    expect(returns.map((row) => ReturnSchema.parse(row))).toEqual(returns);
  });

  it('lists each mirror in its envelope, and refuses to sync a store it doesn’t have', async () => {
    const send = fetchFrom(ecommerceHandlers());
    await expect((await send(`${BASE}/v1/store_return`)).json()).resolves.toMatchObject({
      store_returns: [{ id: 'r1' }],
    });
    const gone = await send(`${BASE}/v1/store_order/sync`, {
      method: 'POST',
      body: JSON.stringify({ provider_instance_id: 'gone', days: 30 }),
    });
    expect(gone.status).toBe(HTTP_NOT_FOUND);
  });
});
