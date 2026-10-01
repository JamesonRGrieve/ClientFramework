// SPDX-License-Identifier: AGPL-3.0-or-later
import type { RowData } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { JSX } from 'react';
import type { DataTableInstance } from './data-table-features';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** The page sizes a reader can pick: multiples of the step, up to the largest. */
const PAGE_SIZE_STEP = 10;
const PAGE_SIZE_CHOICES = 5;
const PAGE_SIZES = Array.from({ length: PAGE_SIZE_CHOICES }, (_, index) => (index + 1) * PAGE_SIZE_STEP);

interface DataTablePaginationProps<TData extends RowData> {
  table: DataTableInstance<TData>;
}

export function DataTablePagination<TData extends RowData>({ table }: DataTablePaginationProps<TData>): JSX.Element {
  const { pageIndex, pageSize } = table.state.pagination;
  return (
    <div className='flex items-center justify-between'>
      <div className='flex-1 text-sm text-muted-foreground'>
        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className='flex items-center space-x-6 lg:space-x-8'>
        <div className='flex items-center space-x-2'>
          <p className='text-sm font-medium'>Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
          Page {pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            className='hidden w-8 h-8 p-0 lg:flex'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant='outline'
            className='w-8 h-8 p-0'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant='outline'
            className='w-8 h-8 p-0'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant='outline'
            className='hidden w-8 h-8 p-0 lg:flex'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
