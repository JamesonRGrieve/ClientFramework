// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { familyFixture, personOf } from './genealogy.mocks';
import { Lineage } from './Lineage';
import { renderGenealogy } from './testing.mocks';

describe('Lineage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the ancestors generation by generation, each linking to their page', async () => {
    const store = familyFixture();
    const view = renderGenealogy(<Lineage person={personOf(store, 'byron-jr')} people={store.persons} />, store);
    const parents = await view.findByRole('region', { name: 'Parents' });
    expect(
      within(parents)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/genealogy/ada', '/genealogy/william']);
    expect(view.getByRole('region', { name: 'Grandparents' })).toHaveTextContent('George Gordon Byron');
  });

  it('walks down to the descendants, as far as asked', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<Lineage person={personOf(store, 'byron')} people={store.persons} />, store);
    await user.selectOptions(view.getByLabelText('Show'), 'Descendants');
    expect(await view.findByRole('region', { name: 'Grandchildren' })).toHaveTextContent('Anne Blunt');
    await user.selectOptions(view.getByLabelText('Generations'), '1');
    await vi.waitFor(() => {
      expect(view.queryByRole('region', { name: 'Grandchildren' })).toBeNull();
    });
    expect(view.getByRole('region', { name: 'Children' })).toHaveTextContent('Ada Lovelace');
  });

  it('follows only the parental roles ticked', async () => {
    const store = familyFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<Lineage person={personOf(store, 'ada')} people={store.persons} />, store);
    await view.findByRole('region', { name: 'Parents' });
    await user.click(view.getByRole('checkbox', { name: 'adopted' }));
    expect(await view.findByText('No ancestors are recorded for Ada Lovelace.')).toBeInTheDocument();
  });
});
