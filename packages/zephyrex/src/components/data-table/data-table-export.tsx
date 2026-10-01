'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { RowData } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import type { JSX } from 'react';

import type { DataTableInstance } from './data-table-features';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DataTableExport<TData extends RowData>({ table }: { table: DataTableInstance<TData> }): JSX.Element {
  const rows = table.getFilteredRowModel().rows.map((row) => row.original);
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())
    .map((column) => column.columnDef.meta?.headerName);

  const downloadCSV = (): void => {
    const csvRows = [['id', ...columns], ...rows.map((row): unknown[] => Object.values(row))]
      .map((row) => row.map((cell) => `"${String(cell)}"`).join(','))
      .join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='rounded-lg'>
          <Download className='w-4 h-4 mr-2' />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Export As</DropdownMenuLabel>
        <DropdownMenuItem onClick={downloadCSV}>CSV (.csv)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
