// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { familyFixture } from './genealogy.mocks';
import { PeopleList } from './PeopleList';
import { renderGenealogy } from './testing.mocks';

describe('PeopleList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists everyone by name with their years, each linking to their page', async () => {
    const view = renderGenealogy(<PeopleList />);
    const table = await view.findByRole('table', { name: 'People' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => row.querySelector('a .truncate')?.textContent)).toEqual([
      'Ada Lovelace',
      'Anne Blunt',
      'Anne Isabella Milbanke',
      'Byron King-Noel',
      'George Gordon Byron',
      'Ralph King-Milbanke',
      'William King',
    ]);
    expect(rows[0]).toHaveTextContent('1815–1852');
    expect(within(table).getByRole('link', { name: /Ada Lovelace/ })).toHaveAttribute('href', '/genealogy/ada');
  });

  it('adds a person to the tree, then opens them to record how they are connected', async () => {
    const store = familyFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderGenealogy(<PeopleList />, store);
    await view.findByRole('table', { name: 'People' });
    await user.click(view.getByRole('button', { name: 'Add person' }));
    await user.type(view.getByLabelText('Name'), 'Medora Leigh');
    await user.click(within(view.getByRole('dialog')).getByRole('button', { name: 'Add person' }));
    expect(await view.findByRole('link', { name: /Medora Leigh/ })).toBeInTheDocument();
    expect(store.persons.at(-1)?.name).toBe('Medora Leigh');
    expect(push).toHaveBeenCalledWith(`/genealogy/${store.persons.at(-1)?.id ?? ''}`);
  });

  it('says when nobody is recorded yet', async () => {
    const view = renderGenealogy(<PeopleList />, { persons: [], relationships: [] });
    expect(await view.findByText(/^Nobody is recorded yet\./)).toBeInTheDocument();
  });
});
