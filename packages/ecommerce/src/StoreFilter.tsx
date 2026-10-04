// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, useId } from 'react';
import type { ProviderInstance } from 'zephyrex';

const ALL_STORES = '';

/** Choose one of the user's stores, or all of them (null). */
export function StoreFilter({
  stores,
  value,
  onChange,
}: {
  stores: readonly ProviderInstance[];
  value: string | null;
  onChange: (storeId: string | null) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor={id}>Store</Label>
      <select
        id={id}
        className='rounded-md border bg-background px-2 py-1 text-sm'
        value={value ?? ALL_STORES}
        onChange={(event) => onChange(event.target.value === ALL_STORES ? null : event.target.value)}
      >
        <option value={ALL_STORES}>All stores</option>
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/** The rows from store `storeId`, or every row when no store is chosen. */
export const fromStore = <T extends { provider_instance_id: string }>(rows: readonly T[], storeId: string | null): T[] =>
  storeId === null ? [...rows] : rows.filter(({ provider_instance_id: store }) => store === storeId);
