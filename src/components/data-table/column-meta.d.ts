// SPDX-License-Identifier: AGPL-3.0-or-later
// The data table's columns carry their source field and display name as TanStack column meta
// (createColumns sets `meta: col`); declaring it lets the toolbar, filter and export read it typed.
import type { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    field?: string;
    headerName?: string;
  }
}
