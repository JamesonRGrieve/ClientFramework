// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  type CellData,
  type Column,
  type ColumnDef,
  type ReactTable,
  type RowData,
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_equals,
  filterFn_inDateRange,
  filterFn_inNumberRange,
  filterFn_includesString,
  filterFn_weakEquals,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table';
/**
 * A column's source field and display name (createColumns sets `meta: col`), so the toolbar,
 * filter and export read them typed.
 */
export interface DataTableColumnMeta {
  field?: string;
  headerName?: string;
}

/** Table-wide meta: an optional title the toolbar shows. */
export interface DataTableMeta {
  title?: string;
}

/**
 * The one feature set every data table and its toolbar, header, pagination and export share.
 * The filter and sort registries hold every function a column's `'auto'` choice can resolve to,
 * so an un-configured column filters and sorts by its value type.
 */
export const dataTableFeatures = tableFeatures({
  rowSelectionFeature,
  columnVisibilityFeature,
  columnFilteringFeature,
  columnFacetingFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    inNumberRange: filterFn_inNumberRange,
    equals: filterFn_equals,
    arrIncludes: filterFn_arrIncludes,
    inDateRange: filterFn_inDateRange,
    weakEquals: filterFn_weakEquals,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
  columnMeta: metaHelper<DataTableColumnMeta>(),
  tableMeta: metaHelper<DataTableMeta>(),
});

export type DataTableFeatures = typeof dataTableFeatures;

/** A data table instance, as the toolbar, pagination and export receive it. */
export type DataTableInstance<TData extends RowData> = ReactTable<DataTableFeatures, TData>;

/** A column of a data table. */
export type DataTableColumn<TData extends RowData, TValue extends CellData = CellData> = Column<
  DataTableFeatures,
  TData,
  TValue
>;

/** A column definition for a data table. */
export type DataTableColumnDef<TData extends RowData, TValue extends CellData = CellData> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;
