// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { ecommerceHandlers } from './ecommerce.mocks';
import { syncStore, useOrders, useProducts, useReturns, useSalesReport, useStores } from './storeApi';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

describe('the store API', () => {
  let signOut: () => void = () => undefined;

  beforeEach(() => {
    signOut = withSession();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(ecommerceHandlers())));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    signOut();
  });

  it('finds the stores among the provider instances: those of the e-commerce providers', async () => {
    const { result } = renderHook(() => useStores(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.stores.map(({ name }) => name)).toEqual(['Maker shop', 'Etsy prints']);
    });
  });

  it('reads the orders newest first, and the products and returns', async () => {
    const orders = renderHook(() => useOrders(), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(orders.current.data?.map(({ id }) => id)).toEqual(['o2', 'o1']);
    });
    const products = renderHook(() => useProducts(), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(products.current.data).toHaveLength(2);
    });
    const returns = renderHook(() => useReturns(), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(returns.current.data?.map(({ id }) => id)).toEqual(['r1']);
    });
  });

  it('reads the sales report for a period, across the stores or one of them', async () => {
    const all = renderHook(() => useSalesReport(30, null), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(all.current.data).toMatchObject({ orders: 2, revenue: { CAD: '42.50' } });
    });
    const etsy = renderHook(() => useSalesReport(30, 'etsy-1'), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(etsy.current.data).toMatchObject({ orders: 1, by_status: { cancelled: 1 }, revenue: {} });
    });
  });

  it('syncs a store, each kind read or why it can’t be', async () => {
    await expect(syncStore(client, 'etsy-1', 30)).resolves.toEqual({
      store: 'etsy-1',
      synced: { order: 1, product: 1, return: 'unsupported: Etsy has no returns API' },
    });
  });
});
