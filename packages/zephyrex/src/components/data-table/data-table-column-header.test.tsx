// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createColumns } from './data-table-columns';
import { DataTable } from './index';

type Row = { name: string };

const renderTable = (): ReturnType<typeof render> =>
  render(
    <DataTable<Row>
      columns={createColumns<Row>([{ field: 'name', headerName: 'Name' }])}
      data={[{ name: 'Beta' }, { name: 'Alpha' }]}
    />,
  );

// Radix menus open from the keyboard under jsdom; pointer events do not reach them.
const chooseSort = async (user: ReturnType<typeof userEvent.setup>, trigger: HTMLElement, choice: string) => {
  trigger.focus();
  await user.keyboard('{Enter}');
  within(await screen.findByRole('menu'))
    .getByRole('menuitem', { name: choice })
    .focus();
  await user.keyboard('{Enter}');
};

describe('DataTableColumnHeader', () => {
  it('tells assistive tech how a sortable column is sorted, on the header and its trigger', async () => {
    const user = userEvent.setup();
    renderTable();
    const header = screen.getByRole('columnheader', { name: /Name/ });
    expect(header).toHaveAttribute('aria-sort', 'none');
    const trigger = within(header).getByRole('button', { name: 'Sort Name, not sorted' });

    await chooseSort(user, trigger, 'Asc');
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(within(header).getByRole('button', { name: 'Sort Name, sorted ascending' })).toBeInTheDocument();

    await chooseSort(user, within(header).getByRole('button', { name: /^Sort Name/ }), 'Desc');
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('leaves aria-sort off a column that cannot sort', () => {
    renderTable();
    const selectHeader = screen.getByRole('columnheader', { name: 'Select all' });
    expect(selectHeader).not.toHaveAttribute('aria-sort');
  });
});
