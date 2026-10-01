'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { RowData } from '@tanstack/react-table';
import { Copy } from 'lucide-react';
import { DataTableColumnHeader } from './data-table-column-header';
import type { DataTableColumnDef } from './data-table-features';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ColumnData {
  field: string;
  headerName: string;
}

export function createColumns<TData extends RowData>(columns: ColumnData[]): DataTableColumnDef<TData>[] {
  const selectColumn: DataTableColumnDef<TData> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(value !== false)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(value !== false)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const actionsColumn: DataTableColumnDef<TData> = {
    id: 'actions',
    enableHiding: false,
    enableSorting: false,
    header: () => <span className='sr-only'>Actions</span>,
    cell: ({ row }) => {
      const copyData = (): void => {
        void navigator.clipboard.writeText(Object.values(row.original).join(', '));
      };

      return (
        <TooltipProvider>
          <div className='flex justify-end gap-1'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='outline' size='icon' className='w-8 h-8 bg-transparent' onClick={copyData}>
                  <Copy className='w-3 h-3' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy Data</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );
    },
  };

  const dynamicColumns: DataTableColumnDef<TData>[] = columns.map((col) => ({
    id: col.field,
    accessorKey: col.field,
    header: ({ column }) => <DataTableColumnHeader column={column} title={col.headerName} />,
    enableColumnFilter: true,
    enableSorting: true,
    enableHiding: true,
    cell: (info) => info.getValue(),
    meta: col,
  }));

  return [selectColumn, ...dynamicColumns, actionsColumn];
}
