// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComparisonTable } from './ComparisonTable';

const COLUMNS = ['Cule', 'Spreadsheets'];
const ROWS = [
  { feature: 'Who is in your life', values: ['A map you can share', 'A tab per person'] },
  { feature: 'Birthdays', values: ['Reminded a week ahead', 'If you remember'] },
];

describe('ComparisonTable', () => {
  it('is a table with a header per column from 640px up', () => {
    render(<ComparisonTable columns={COLUMNS} rows={ROWS} />);
    const table = screen.getByRole('table');
    expect(table.parentElement).toHaveClass('hidden', 'sm:block');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Feature', ...COLUMNS]);
    expect(within(table).getByRole('rowheader', { name: 'Birthdays' })).toBeInTheDocument();
  });

  it('is a card per row on a phone, each value under its column name, so nothing is cut off', () => {
    render(<ComparisonTable columns={COLUMNS} rows={ROWS} />);
    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.parentElement).toHaveClass('sm:hidden');
    const terms = within(cards[0]).getAllByRole('term');
    expect(terms.map((term) => term.textContent)).toEqual(COLUMNS);
    expect(within(cards[0]).getByText('A tab per person')).toHaveClass('text-muted-foreground');
  });
});
