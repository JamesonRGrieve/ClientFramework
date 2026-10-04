// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { ecommerceExtension as registered } from 'zephyrex/extensions';
import { OrdersPage } from './OrdersPage';
import { ProductsPage } from './ProductsPage';
import { ReturnsPage } from './ReturnsPage';
import { ORDERS_PATH, PRODUCTS_PATH, RETURNS_PATH, STORE_PATH } from './routes';
import { StorePage } from './StorePage';

/** The e-commerce client extension with its pages and menu entry, for an app's `extensions`: the user's stores. */
export const ecommerceExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: STORE_PATH, component: StorePage },
    { path: ORDERS_PATH, component: OrdersPage },
    { path: PRODUCTS_PATH, component: ProductsPage },
    { path: RETURNS_PATH, component: ReturnsPage },
  ],
  navItems: [{ title: 'Stores', url: STORE_PATH }],
};
