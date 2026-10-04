// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's e-commerce extension (zephyrex[ecommerce]): the orders, products
// and returns read from the user's stores, their sales, and syncing a store. The stores themselves
// are provider instances, set up on the provider pages; their records are a read-only mirror.
export { ecommerceExtension } from './extension';
export { OrdersPage } from './OrdersPage';
export { ProductsPage } from './ProductsPage';
export { ReturnsPage } from './ReturnsPage';
export { StorePage } from './StorePage';
export { ORDERS_PATH, PRODUCTS_PATH, RETURNS_PATH, STORE_PATH } from './routes';
export {
  ORDER_ENDPOINT,
  OrderSchema,
  PRODUCT_ENDPOINT,
  ProductSchema,
  REPORT_PERIODS,
  RETURN_ENDPOINT,
  ReturnSchema,
  SalesReportSchema,
  SyncResultSchema,
  syncStore,
  useOrders,
  useProducts,
  useReturns,
  useSalesReport,
  useStores,
} from './storeApi';
export type { LineItem, Order, Product, ReportPeriod, SalesReport, StoreReturn, SyncResult } from './storeApi';
