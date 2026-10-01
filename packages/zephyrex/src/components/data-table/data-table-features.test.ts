// SPDX-License-Identifier: AGPL-3.0-or-later
import { type RenderHookResult, act, renderHook } from '@testing-library/react';
import { useTable } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';
import { type DataTableColumnDef, type DataTableInstance, dataTableFeatures } from './data-table-features';

type Row = { name: string; size: number };

const DATA: Row[] = [
  { name: 'Beta', size: 2 },
  { name: 'alpha', size: 10 },
  { name: 'Gamma', size: 1 },
];

const COLUMNS: DataTableColumnDef<Row>[] = [
  { id: 'name', accessorKey: 'name', meta: { field: 'name', headerName: 'Name' } },
  { id: 'size', accessorKey: 'size' },
];

const renderTable = (): RenderHookResult<DataTableInstance<Row>, void> =>
  renderHook(() => useTable({ features: dataTableFeatures, data: DATA, columns: COLUMNS }));

const names = (rows: { original: Row }[]): string[] => rows.map((row) => row.original.name);

describe('dataTableFeatures', () => {
  it('filters a text column by case-insensitive substring through its auto filter', () => {
    const { result } = renderTable();
    act(() => result.current.getColumn('name')?.setFilterValue('AL'));
    expect(names(result.current.getRowModel().rows)).toEqual(['alpha']);
  });

  it('sorts a text column alphabetically and a number column numerically through their auto sorts', () => {
    const { result } = renderTable();
    act(() => result.current.getColumn('name')?.toggleSorting(false));
    expect(names(result.current.getRowModel().rows)).toEqual(['alpha', 'Beta', 'Gamma']);
    act(() => result.current.getColumn('size')?.toggleSorting(false));
    expect(names(result.current.getRowModel().rows)).toEqual(['Gamma', 'Beta', 'alpha']);
  });

  it('pages rows, counts faceted values, hides columns and selects rows', () => {
    const { result } = renderTable();
    act(() => result.current.setPageSize(2));
    expect(result.current.getRowModel().rows).toHaveLength(2);
    expect(result.current.getPageCount()).toBe(2);

    expect(result.current.getColumn('name')?.getFacetedUniqueValues().get('Beta')).toBe(1);

    act(() => result.current.getColumn('size')?.toggleVisibility(false));
    expect(result.current.getVisibleLeafColumns().map((column) => column.id)).toEqual(['name']);

    act(() => result.current.toggleAllRowsSelected(true));
    expect(result.current.getSelectedRowModel().rows).toHaveLength(DATA.length);
  });

  it('carries the declared column meta', () => {
    const { result } = renderTable();
    expect(result.current.getColumn('name')?.columnDef.meta?.headerName).toBe('Name');
  });
});
