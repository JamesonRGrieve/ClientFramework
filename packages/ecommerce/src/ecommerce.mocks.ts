// SPDX-License-Identifier: AGPL-3.0-or-later
// The e-commerce server for the package's tests and stories (never compiled into dist): two stores
// (provider instances of the extension's providers), the read-only mirror of their orders,
// products and returns, the sales report and the sync action.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { z } from 'zod';
import { ORDER_ENDPOINT, type Order, PRODUCT_ENDPOINT, type Product, RETURN_ENDPOINT, type StoreReturn } from './storeApi';

const HTTP_NOT_FOUND = 404;
const SYNCED_AT = '2026-10-01T09:00:00';

export interface StoreFixture {
  orders: Order[];
  products: Product[];
  returns: StoreReturn[];
}

const mirrored = (
  id: string,
  store: 'shop-1' | 'etsy-1',
): Pick<Order, 'id' | 'provider' | 'provider_instance_id' | 'synced_at'> => ({
  id,
  provider: store === 'shop-1' ? 'shopify' : 'etsy',
  provider_instance_id: store,
  synced_at: SYNCED_AT,
});

/** Two stores' orders, products and returns. */
export function storeFixture(): StoreFixture {
  return {
    orders: [
      {
        ...mirrored('o1', 'shop-1'),
        platform_order_id: '5001',
        order_number: '#1001',
        status: 'delivered',
        customer_name: 'Ada Lovelace',
        total: '42.50',
        currency: 'CAD',
        order_date: '2026-09-20T15:00:00',
        line_items: [{ sku: 'MUG-1', title: 'Engine mug', quantity: 2, price: '21.25' }],
      },
      {
        ...mirrored('o2', 'etsy-1'),
        platform_order_id: '9001',
        order_number: null,
        status: 'cancelled',
        customer_name: null,
        total: '15.00',
        currency: 'USD',
        order_date: '2026-09-28T10:00:00',
        line_items: null,
      },
    ],
    products: [
      {
        ...mirrored('p1', 'shop-1'),
        platform_product_id: '7001',
        sku: 'MUG-1',
        title: 'Engine mug',
        price: '21.25',
        currency: 'CAD',
        quantity: 14,
        is_active: true,
        url: 'https://shop.example.com/products/engine-mug',
      },
      {
        ...mirrored('p2', 'etsy-1'),
        platform_product_id: '8001',
        sku: null,
        title: 'Punch-card print',
        price: '30.00',
        currency: 'USD',
        quantity: null,
        is_active: false,
        url: 'ftp://files.example.com/punch-card.png',
      },
    ],
    returns: [
      {
        ...mirrored('r1', 'shop-1'),
        platform_return_id: 'R-1',
        platform_order_id: '5001',
        status: 'refunded',
        reason: 'Chipped',
        refund: '21.25',
        currency: 'CAD',
      },
    ],
  };
}

const ECOMMERCE = 'ext-ecommerce';
const SHOPIFY = 'prv-shopify';
const ETSY = 'prv-etsy';
const OPENAI = 'prv-openai';

/** The stores, as the provider pages know them: instances of e-commerce providers, and one that isn't. */
export const STORE_PROVIDERS = {
  extensions: [{ id: ECOMMERCE, name: 'ecommerce' }],
  providers: [
    { id: SHOPIFY, name: 'shopify' },
    { id: ETSY, name: 'etsy' },
    { id: OPENAI, name: 'openai' },
  ],
  links: [
    { provider_id: SHOPIFY, extension_id: ECOMMERCE },
    { provider_id: ETSY, extension_id: ECOMMERCE },
  ],
  instances: [
    { id: 'shop-1', name: 'Maker shop', provider_id: SHOPIFY, created_at: SYNCED_AT },
    { id: 'etsy-1', name: 'Etsy prints', provider_id: ETSY, created_at: SYNCED_AT },
    { id: 'gpt-1', name: 'GPT', provider_id: OPENAI, created_at: SYNCED_AT },
  ],
};

const SyncBodySchema = z.object({ provider_instance_id: z.string(), days: z.number().int() });

/** The report the server would give for `orders` (fixed figures: the fixture is small). */
const report = (orders: readonly Order[]): object => ({
  since: '2026-09-01T00:00:00Z',
  orders: orders.length,
  by_status: Object.fromEntries(
    [...new Set(orders.map(({ status }) => status))].map((status) => [
      status,
      orders.filter((order) => order.status === status).length,
    ]),
  ),
  revenue: orders.some(({ status }) => status === 'delivered') ? { CAD: '42.50' } : {},
  top_skus: orders.some(({ status }) => status === 'delivered') ? [{ sku: 'MUG-1', quantity: 2 }] : [],
});

/** The mirror's routes over `fixture`, and the provider routes that name the stores. */
export function ecommerceHandlers(fixture: StoreFixture = storeFixture()): RequestHandler[] {
  return [
    http.get('*/v1/extension', () => HttpResponse.json({ extensions: STORE_PROVIDERS.extensions })),
    http.get('*/v1/provider', () => HttpResponse.json({ providers: STORE_PROVIDERS.providers })),
    http.get('*/v1/provider/extension', () => HttpResponse.json({ provider_extensions: STORE_PROVIDERS.links })),
    http.get('*/v1/provider/instance', () => HttpResponse.json({ provider_instances: STORE_PROVIDERS.instances })),
    http.get(`*${ORDER_ENDPOINT}/report`, ({ request }) => {
      const store = new URL(request.url).searchParams.get('provider_instance_id');
      return HttpResponse.json(
        report(store === null ? fixture.orders : fixture.orders.filter((order) => order.provider_instance_id === store)),
      );
    }),
    http.post(`*${ORDER_ENDPOINT}/sync`, async ({ request }) => {
      const { provider_instance_id: store } = SyncBodySchema.parse(await request.json());
      if (!STORE_PROVIDERS.instances.some(({ id }) => id === store)) {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      const count = <T extends { provider_instance_id: string }>(rows: readonly T[]): number =>
        rows.filter((row) => row.provider_instance_id === store).length;
      return HttpResponse.json({
        store,
        synced: {
          order: count(fixture.orders),
          product: count(fixture.products),
          return: store === 'etsy-1' ? 'unsupported: Etsy has no returns API' : count(fixture.returns),
        },
      });
    }),
    http.get(`*${ORDER_ENDPOINT}`, () => HttpResponse.json({ store_orders: fixture.orders })),
    http.get(`*${PRODUCT_ENDPOINT}`, () => HttpResponse.json({ store_products: fixture.products })),
    http.get(`*${RETURN_ENDPOINT}`, () => HttpResponse.json({ store_returns: fixture.returns })),
  ];
}
