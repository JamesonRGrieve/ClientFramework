// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactElement, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { amount, statusLabel } from './display';
import { RecordsHeader } from './RecordsHeader';
import { type StoreReturn, useReturns, useStores } from './storeApi';
import { fromStore, StoreFilter } from './StoreFilter';

/** One return: the order it returns, its status and refund, and why. */
function ReturnRow({ storeReturn }: { storeReturn: StoreReturn }): ReactElement {
  return (
    <li className='grid gap-1 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <span className='font-medium'>
          Return {storeReturn.platform_return_id}
          {(storeReturn.platform_order_id ?? '') !== '' && (
            <span className='font-normal text-muted-foreground'> of order {storeReturn.platform_order_id}</span>
          )}
        </span>
        <span>{amount(storeReturn.refund, storeReturn.currency)}</span>
      </div>
      <div className='flex flex-wrap justify-between gap-2 text-muted-foreground'>
        <span>{statusLabel(storeReturn.status)}</span>
        {(storeReturn.reason ?? '') !== '' && <span>{storeReturn.reason}</span>}
      </div>
    </li>
  );
}

/** Every return the user's stores hold. */
export function ReturnsPage(): ReactElement {
  const { data: returns = [], error, isLoading } = useReturns();
  const { stores } = useStores();
  const [storeId, setStoreId] = useState<string | null>(null);
  const shown = fromStore(returns, storeId);

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <RecordsHeader title='Returns' />
      <Card>
        <CardHeader>
          <CardTitle>Returns</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {stores.length > 1 && <StoreFilter stores={stores} value={storeId} onChange={setStoreId} />}
          {error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The returns could not be loaded: {error.message}
            </p>
          )}
          {error === undefined && shown.length === 0 && (
            <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'No returns yet.'}</p>
          )}
          {shown.length > 0 && (
            <ul aria-label='Returns' className='divide-y rounded-md border'>
              {shown.map((storeReturn) => (
                <ReturnRow key={storeReturn.id} storeReturn={storeReturn} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
