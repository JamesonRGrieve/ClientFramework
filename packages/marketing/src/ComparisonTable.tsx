// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactNode } from 'react';

/** One compared point: what it is, then its value in each column, in the columns' order. */
export interface ComparisonRow {
  feature: string;
  values: readonly string[];
}

/**
 * A comparison ("How it compares"): a table from 640px up, and on a phone a card per row with
 * each value under its column's name, so nothing is cut off at the edge. A wide table in a box that
 * scrolls sideways passed the overflow check but clipped its last column with no sign it scrolled
 * (Zephyrex RPG's phone audit, 2026-11-21). The first column is the app's own and reads in full
 * colour; the others are muted. Only one of the two forms is ever displayed, so a screen reader
 * meets the comparison once.
 */
export function ComparisonTable({
  columns,
  rows,
  featureLabel = 'Feature',
}: {
  /** The compared things' names, the app's own first (e.g. ['Cule', 'Spreadsheets']). */
  columns: readonly string[];
  rows: readonly ComparisonRow[];
  /** Names the first column for screen readers (it has no visible heading). */
  featureLabel?: string;
}): ReactNode {
  const muted = (column: number): string => (column === 0 ? '' : 'text-muted-foreground');
  return (
    <>
      <ul className='grid gap-3 sm:hidden'>
        {rows.map((row) => (
          <li key={row.feature} className='rounded-xl border p-4'>
            <p className='font-medium'>{row.feature}</p>
            <dl className='mt-2 grid gap-2 text-sm'>
              {columns.map((column, at) => (
                <div key={column} className='grid gap-0.5'>
                  <dt className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>{column}</dt>
                  <dd className={muted(at)}>{row.values[at] ?? ''}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className='hidden overflow-x-auto rounded-xl border sm:block'>
        <table className='w-full text-left text-sm'>
          <thead className='bg-muted/50'>
            <tr>
              <th scope='col' className='p-3 font-semibold'>
                <span className='sr-only'>{featureLabel}</span>
              </th>
              {columns.map((column) => (
                <th key={column} scope='col' className='p-3 font-semibold'>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y'>
            {rows.map((row) => (
              <tr key={row.feature}>
                <th scope='row' className='p-3 font-medium'>
                  {row.feature}
                </th>
                {columns.map((column, at) => (
                  <td key={column} className={`p-3 ${muted(at)}`.trim()}>
                    {row.values[at] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
