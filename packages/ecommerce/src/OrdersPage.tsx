// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, useId, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { amount, shownTime, statusLabel } from './display';
import { RecordsHeader } from './RecordsHeader';
import { type LineItem, type Order, useOrders, useStores } from './storeApi';
import { fromStore, StoreFilter } from './StoreFilter';

const ALL_STATUSES = '';

const lineLabel = ({ title, sku, quantity }: LineItem): string => `${String(quantity ?? 1)} × ${title ?? sku ?? 'Item'}`;

/** One order: number, customer, total and status, with its lines. */
function OrderRow({ order }: { order: Order }): ReactElement {
  const lines = order.line_items ?? [];
  return (
    <li className='grid gap-1 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <span className='font-medium'>
          Order {order.order_number ?? order.platform_order_id}
          {(order.customer_name ?? '') !== '' && (
            <span className='font-normal text-muted-foreground'> for {order.customer_name}</span>
          )}
        </span>
        <span>{amount(order.total, order.currency)}</span>
      </div>
      <div className='flex flex-wrap justify-between gap-2 text-muted-foreground'>
        <span>{statusLabel(order.status)}</span>
        <span>{shownTime(order.order_date)}</span>
      </div>
      {lines.length > 0 && (
        <ul aria-label={`Lines of order ${order.order_number ?? order.platform_order_id}`} className='pl-4'>
          {lines.map((line, index) => (
            <li key={`${line.sku ?? ''}-${String(index)}`}>{lineLabel(line)}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Every order the user's stores hold, newest first, by store and status. */
export function OrdersPage(): ReactElement {
  const statusId = useId();
  const { data: orders = [], error, isLoading } = useOrders();
  const { stores } = useStores();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [status, setStatus] = useState(ALL_STATUSES);
  const inStore = fromStore(orders, storeId);
  const statuses = [...new Set(inStore.map((order) => order.status))].sort();
  const shown = status === ALL_STATUSES ? inStore : inStore.filter((order) => order.status === status);

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <RecordsHeader title='Orders' />
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='flex flex-wrap gap-4'>
            {stores.length > 1 && <StoreFilter stores={stores} value={storeId} onChange={setStoreId} />}
            {statuses.length > 1 && (
              <div className='flex items-center gap-2'>
                <Label htmlFor={statusId}>Status</Label>
                <select
                  id={statusId}
                  className='rounded-md border bg-background px-2 py-1 text-sm'
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value={ALL_STATUSES}>Every status</option>
                  {statuses.map((option) => (
                    <option key={option} value={option}>
                      {statusLabel(option)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The orders could not be loaded: {error.message}
            </p>
          )}
          {error === undefined && shown.length === 0 && (
            <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'No orders yet.'}</p>
          )}
          {shown.length > 0 && (
            <ul aria-label='Orders' className='divide-y rounded-md border'>
              {shown.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
