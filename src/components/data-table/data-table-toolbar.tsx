'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { DataTableViewOptions } from './data-table-view-options';
import { DataTableFilter } from './data-table-filter';
import { DataTableExport } from './data-table-export';
import { Button } from '@/components/ui/button';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const title = (table.options.meta as Record<string, unknown> | undefined)?.['title'] as string | undefined;

  return (
    <div className='flex items-center justify-end gap-2'>
      {title && <h4 className='text-2xl font-bold mr-auto'>{title}</h4>}
      {isFiltered && (
        <Button variant='ghost' onClick={() => table.resetColumnFilters()} size='sm' className='h-8 px-2'>
          Reset
          <X className='w-4 h-4' />
        </Button>
      )}
      <DataTableFilter table={table} />
      <DataTableViewOptions table={table} />
      <DataTableExport table={table} />
    </div>
  );
}
