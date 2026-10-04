// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { type ReactElement, useId, useState } from 'react';
import { useSWRConfig } from 'swr';
import { type ProviderInstance, useClient } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { statusLabel } from './display';
import { ORDERS_PATH, PRODUCTS_PATH, RETURNS_PATH } from './routes';
import { REPORT_PERIODS, type ReportPeriod, type SyncResult, syncStore, useSalesReport, useStores } from './storeApi';
import { StoreFilter } from './StoreFilter';

const DEFAULT_PERIOD: ReportPeriod = 30;

const isPeriod = (value: number): value is ReportPeriod => REPORT_PERIODS.some((period) => period === value);

/** What one sync read, in words: "12 orders, 40 products, returns unsupported". */
export function syncSummary({ synced }: SyncResult): string {
  return Object.entries(synced)
    .map(([kind, read]) => (typeof read === 'number' ? `${String(read)} ${kind}s` : `${kind}s ${read}`))
    .join(', ');
}

/** One store, with a button to read its latest orders, products and returns from the platform. */
function StoreRow({ store, days }: { store: ProviderInstance; days: ReportPeriod }): ReactElement {
  const client = useClient();
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);

  const sync = async (): Promise<void> => {
    setPending(true);
    try {
      const result = await syncStore(client, store.id, days);
      // Everything read from the mirror may have changed.
      await mutate(() => true);
      setNotice({ text: `Synced: ${syncSummary(result)}.`, alert: false });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : `${store.name} could not be synced.`, alert: true });
    } finally {
      setPending(false);
    }
  };

  return (
    <li className='grid gap-1 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='font-medium'>{store.name}</span>
        <Button
          size='sm'
          variant='outline'
          disabled={pending}
          onClick={() => {
            void sync();
          }}
        >
          Sync {store.name}
        </Button>
      </div>
      {notice !== null && (
        <p role={notice.alert ? 'alert' : 'status'} className={notice.alert ? 'text-destructive' : 'text-muted-foreground'}>
          {notice.text}
        </p>
      )}
    </li>
  );
}

/** Sales across the user's stores over a chosen period, the stores themselves, and the way to their records. */
export function StorePage(): ReactElement {
  const periodId = useId();
  const [days, setDays] = useState<ReportPeriod>(DEFAULT_PERIOD);
  const [storeId, setStoreId] = useState<string | null>(null);
  const { stores, isLoading } = useStores();
  const { data: report, error: reportFailure } = useSalesReport(days, storeId);
  const revenue = Object.entries(report?.revenue ?? {});

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h1 className='text-3xl font-semibold'>Stores</h1>
        <nav aria-label='Store records' className='flex gap-4 text-sm'>
          <Link href={ORDERS_PATH} className='underline'>
            Orders
          </Link>
          <Link href={PRODUCTS_PATH} className='underline'>
            Products
          </Link>
          <Link href={RETURNS_PATH} className='underline'>
            Returns
          </Link>
        </nav>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sales</CardTitle>
          <CardDescription>
            From the latest sync of each store; cancelled and refunded orders are left out of revenue.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center gap-2'>
              <Label htmlFor={periodId}>Period</Label>
              <select
                id={periodId}
                className='rounded-md border bg-background px-2 py-1 text-sm'
                value={days}
                onChange={(event) => {
                  const chosen = Number(event.target.value);
                  if (isPeriod(chosen)) {
                    setDays(chosen);
                  }
                }}
              >
                {REPORT_PERIODS.map((period) => (
                  <option key={period} value={period}>
                    Last {period} days
                  </option>
                ))}
              </select>
            </div>
            {stores.length > 1 && <StoreFilter stores={stores} value={storeId} onChange={setStoreId} />}
          </div>
          {reportFailure !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The sales report could not be loaded: {reportFailure.message}
            </p>
          )}
          {report !== undefined && (
            <dl className='grid gap-4 sm:grid-cols-2'>
              <div>
                <dt className='text-sm text-muted-foreground'>Orders</dt>
                <dd className='text-2xl font-semibold'>{report.orders}</dd>
              </div>
              <div>
                <dt className='text-sm text-muted-foreground'>Revenue</dt>
                <dd className='text-2xl font-semibold'>
                  {revenue.length === 0 ? '—' : revenue.map(([currency, total]) => `${total} ${currency}`).join(', ')}
                </dd>
              </div>
              <div>
                <dt className='text-sm text-muted-foreground'>By status</dt>
                <dd>
                  <ul aria-label='Orders by status' className='text-sm'>
                    {Object.entries(report.by_status).map(([status, count]) => (
                      <li key={status}>
                        {statusLabel(status)}: {count}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt className='text-sm text-muted-foreground'>Top SKUs</dt>
                <dd>
                  <ol aria-label='Top SKUs' className='text-sm'>
                    {report.top_skus.map(({ sku, quantity }) => (
                      <li key={sku}>
                        {sku}: {quantity}
                      </li>
                    ))}
                  </ol>
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your stores</CardTitle>
          <CardDescription>Stores are provider instances, set up on the provider pages.</CardDescription>
        </CardHeader>
        <CardContent>
          {stores.length === 0 ? (
            <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'No stores are connected yet.'}</p>
          ) : (
            <ul aria-label='Stores' className='divide-y rounded-md border'>
              {stores.map((store) => (
                <StoreRow key={store.id} store={store} days={days} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
