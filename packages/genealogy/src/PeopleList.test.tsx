// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    const list = await view.findByRole('list', { name: 'People' });
    const links = within(list).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Ada Lovelace1815–1852',
      'Anne Blunt1837–1917',
      'Anne Isabella Milbanke1792–1860',
      'Byron King-Noel1836–1862',
      'George Gordon Byron1788–1824',
      'Ralph King-Milbanke1839–1906',
      'William King1805–1893',
    ]);
    expect(within(list).getByRole('link', { name: /Ada Lovelace/ })).toHaveAttribute('href', '/genealogy/ada');
  });

  it('adds a person to the tree', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<PeopleList />, store);
    await view.findByRole('list', { name: 'People' });
    await user.click(view.getByText('Add a person'));
    await user.type(view.getByLabelText('Name'), 'Medora Leigh');
    await user.click(view.getByRole('button', { name: 'Add person' }));
    expect(await view.findByRole('link', { name: /Medora Leigh/ })).toBeInTheDocument();
    expect(store.persons.at(-1)?.name).toBe('Medora Leigh');
  });

  it('says when nobody is recorded yet', async () => {
    const view = renderGenealogy(<PeopleList />, { persons: [], relationships: [] });
    expect(await view.findByText('Nobody is recorded yet.')).toBeInTheDocument();
  });
});
