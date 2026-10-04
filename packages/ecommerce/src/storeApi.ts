// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import {
  type ProviderInstance,
  scopeProviderInstances,
  useClient,
  useProviderExtensionLinks,
  useProviderInstances,
  useProviders,
  useServerExtensions,
  type ZephyrexClient,
} from 'zephyrex';
import { z } from 'zod';

export const ORDER_ENDPOINT = '/v1/store_order';
export const PRODUCT_ENDPOINT = '/v1/store_product';
export const RETURN_ENDPOINT = '/v1/store_return';

/** The server extension whose providers are the stores. */
const ECOMMERCE_EXTENSION = 'ecommerce';

/** The periods a report covers, in days; the server takes 1 to 365. */
const WEEK = 7;
const MONTH = 30;
const QUARTER = 90;
const YEAR = 365;
export const REPORT_PERIODS = [WEEK, MONTH, QUARTER, YEAR] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

const optionalText = z.string().nullable().optional();
/** A decimal amount, as the store wrote it: shown as given, never added up as a float. */
const decimal = optionalText;

/** What every mirrored record carries: which store it came from, and when it was read. */
const mirrored = {
  id: z.string(),
  provider: z.string(),
  provider_instance_id: z.string(),
  synced_at: z.string(),
};

const LineItemSchema = z.looseObject({
  sku: optionalText,
  title: optionalText,
  quantity: z.number().nullable().optional(),
  price: decimal,
});
export type LineItem = z.infer<typeof LineItemSchema>;

export const OrderSchema = z.object({
  ...mirrored,
  platform_order_id: z.string(),
  order_number: optionalText,
  /** pending, processing, shipped, delivered, cancelled, refunded or other. */
  status: z.string(),
  customer_name: optionalText,
  customer_email: optionalText,
  total: decimal,
  currency: optionalText,
  order_date: optionalText,
  line_items: z.array(LineItemSchema).nullable().optional(),
});
export type Order = z.infer<typeof OrderSchema>;

export const ProductSchema = z.object({
  ...mirrored,
  platform_product_id: z.string(),
  sku: optionalText,
  title: optionalText,
  price: decimal,
  currency: optionalText,
  quantity: z.number().int().nullable().optional(),
  is_active: z.boolean(),
  url: optionalText,
});
export type Product = z.infer<typeof ProductSchema>;

export const ReturnSchema = z.object({
  ...mirrored,
  platform_return_id: z.string(),
  platform_order_id: optionalText,
  /** requested, approved, rejected, refunded, closed or other. */
  status: z.string(),
  reason: optionalText,
  refund: decimal,
  currency: optionalText,
  line_items: z.array(LineItemSchema).nullable().optional(),
});
export type StoreReturn = z.infer<typeof ReturnSchema>;

export const SalesReportSchema = z.object({
  since: z.string(),
  orders: z.number().int(),
  by_status: z.record(z.string(), z.number().int()),
  /** Per currency, with cancelled and refunded orders left out. */
  revenue: z.record(z.string(), z.string()),
  top_skus: z.array(z.object({ sku: z.string(), quantity: z.number() })),
});
export type SalesReport = z.infer<typeof SalesReportSchema>;

/** What one sync read from the store, per kind: a count, or why the store can't give that kind. */
export const SyncResultSchema = z.object({
  store: z.string(),
  synced: z.record(z.string(), z.union([z.number(), z.string()])),
});
export type SyncResult = z.infer<typeof SyncResultSchema>;

/** The stores the signed-in user can see: provider instances of the e-commerce providers. */
export function useStores(): { stores: ProviderInstance[]; isLoading: boolean } {
  const { data: extensions = [] } = useServerExtensions();
  const { data: providers = [] } = useProviders();
  const { data: links = [] } = useProviderExtensionLinks();
  const { data: instances = [], isLoading } = useProviderInstances();
  const extensionId = extensions.find(({ name }) => name === ECOMMERCE_EXTENSION)?.id ?? null;
  return {
    stores:
      extensionId === null
        ? []
        : scopeProviderInstances({ providers, links, instances }, { extensionId, providerId: null }).instances,
    isLoading,
  };
}

const newestBy =
  <T>(timeOf: (row: T) => string | null | undefined) =>
  (a: T, b: T): number =>
    (timeOf(b) ?? '').localeCompare(timeOf(a) ?? '');

/** Every order the user's stores hold, newest first. */
export function useOrders(): SWRResponse<Order[], Error> {
  const client = useClient();
  return useSWR<Order[], Error>(client.url(ORDER_ENDPOINT), async () =>
    (await client.list(ORDER_ENDPOINT, 'store_orders', OrderSchema)).sort(newestBy(({ order_date: at }) => at)),
  );
}

/** Every product the user's stores list. */
export function useProducts(): SWRResponse<Product[], Error> {
  const client = useClient();
  return useSWR<Product[], Error>(client.url(PRODUCT_ENDPOINT), async () =>
    client.list(PRODUCT_ENDPOINT, 'store_products', ProductSchema),
  );
}

/** Every return the user's stores hold, newest read first. */
export function useReturns(): SWRResponse<StoreReturn[], Error> {
  const client = useClient();
  return useSWR<StoreReturn[], Error>(client.url(RETURN_ENDPOINT), async () =>
    (await client.list(RETURN_ENDPOINT, 'store_returns', ReturnSchema)).sort(newestBy(({ synced_at: at }) => at)),
  );
}

/** Sales over the last `days` days, across the user's stores or one of them. */
export function useSalesReport(days: ReportPeriod, storeId: string | null): SWRResponse<SalesReport, Error> {
  const client = useClient();
  const params = { days: String(days), ...(storeId === null ? {} : { provider_instance_id: storeId }) };
  const path = `${ORDER_ENDPOINT}/report`;
  return useSWR<SalesReport, Error>(client.url(path, params), async () =>
    SalesReportSchema.parse(await client.get(path, params)),
  );
}

/** Reads a store's last `days` days of orders, products and returns into the mirror. */
export async function syncStore(client: ZephyrexClient, storeId: string, days: ReportPeriod): Promise<SyncResult> {
  return SyncResultSchema.parse(await client.post(`${ORDER_ENDPOINT}/sync`, { provider_instance_id: storeId, days }));
}
