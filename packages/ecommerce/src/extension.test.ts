// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { ecommerceExtension as registered } from 'zephyrex/extensions';
import { ecommerceExtension } from './extension';
import { OrdersPage } from './OrdersPage';
import { ProductsPage } from './ProductsPage';
import { ReturnsPage } from './ReturnsPage';
import { StorePage } from './StorePage';

describe('ecommerceExtension', () => {
  it('is the registered e-commerce extension, with the store pages and a menu entry', () => {
    expect(ecommerceExtension).toMatchObject({ name: 'ecommerce', serverExtension: 'ecommerce' });
    expect(ecommerceExtension.displayName).toBe(registered.displayName);
    expect(ecommerceExtension.pages).toEqual([
      { path: '/store', component: StorePage },
      { path: '/store/orders', component: OrdersPage },
      { path: '/store/products', component: ProductsPage },
      { path: '/store/returns', component: ReturnsPage },
    ]);
    expect(ecommerceExtension.navItems).toEqual([{ title: 'Stores', url: '/store' }]);
  });
});
