// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/ecommerce', () => {
  it('publishes the store pages, their reads, syncing and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'ORDERS_PATH',
        'ORDER_ENDPOINT',
        'OrderSchema',
        'OrdersPage',
        'PRODUCTS_PATH',
        'PRODUCT_ENDPOINT',
        'ProductSchema',
        'ProductsPage',
        'REPORT_PERIODS',
        'RETURNS_PATH',
        'RETURN_ENDPOINT',
        'ReturnSchema',
        'ReturnsPage',
        'STORE_PATH',
        'SalesReportSchema',
        'StorePage',
        'SyncResultSchema',
        'ecommerceExtension',
        'syncStore',
        'useOrders',
        'useProducts',
        'useReturns',
        'useSalesReport',
        'useStores',
      ].sort(),
    );
  });
});
