// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactElement, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { amount, linkTarget } from './display';
import { RecordsHeader } from './RecordsHeader';
import { type Product, useProducts, useStores } from './storeApi';
import { fromStore, StoreFilter } from './StoreFilter';

const titleOf = (product: Product): string => product.title ?? product.sku ?? product.platform_product_id;
const byTitle = (a: Product, b: Product): number => titleOf(a).localeCompare(titleOf(b));

/** One product: its title (linking to the store's page), SKU, price, stock and whether it is listed. */
function ProductRow({ product }: { product: Product }): ReactElement {
  const page = linkTarget(product.url);
  return (
    <li className='flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm'>
      <span>
        {page === null ? (
          <span className='font-medium'>{titleOf(product)}</span>
        ) : (
          <a href={page} target='_blank' rel='noreferrer noopener' className='font-medium underline'>
            {titleOf(product)}
          </a>
        )}
        {(product.sku ?? '') !== '' && <span className='text-muted-foreground'> · {product.sku}</span>}
      </span>
      <span className='flex gap-4'>
        <span>{amount(product.price, product.currency)}</span>
        <span className='text-muted-foreground'>
          {product.quantity === null || product.quantity === undefined
            ? 'Stock unknown'
            : `${String(product.quantity)} in stock`}
        </span>
        {!product.is_active && <span className='text-muted-foreground'>Not listed</span>}
      </span>
    </li>
  );
}

/** Every product the user's stores list, by title. */
export function ProductsPage(): ReactElement {
  const { data: products = [], error, isLoading } = useProducts();
  const { stores } = useStores();
  const [storeId, setStoreId] = useState<string | null>(null);
  const shown = fromStore(products, storeId).sort(byTitle);

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <RecordsHeader title='Products' />
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {stores.length > 1 && <StoreFilter stores={stores} value={storeId} onChange={setStoreId} />}
          {error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The products could not be loaded: {error.message}
            </p>
          )}
          {error === undefined && shown.length === 0 && (
            <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'No products yet.'}</p>
          )}
          {shown.length > 0 && (
            <ul aria-label='Products' className='divide-y rounded-md border'>
              {shown.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
