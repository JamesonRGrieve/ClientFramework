// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nth, TestWrapper } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { familyFixture, genealogyHandlers } from './genealogy.mocks';
import { PeopleList } from './PeopleList';
import { renderGenealogy } from './testing.mocks';

describe('PeopleList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'zx_csrf=; path=/; max-age=0';
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

  it('heads the page with the count beside the title, and no second heading', async () => {
    const view = renderGenealogy(<PeopleList title='People' />);
    await view.findByRole('table', { name: 'People' });
    expect(view.getByRole('heading', { level: 1, name: 'People' })).toBeInTheDocument();
    expect(view.getByText('· 7')).toBeInTheDocument();
    expect(view.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('says when someone is not connected to you yet, so every row has a second line', async () => {
    const { persons } = familyFixture();
    const ada = nth(persons, 2);
    const ralph = nth(persons, 6);
    const store = { persons: [{ ...ada, linked_user_id: 'user-1' }, ralph], relationships: [] };
    const user = { id: 'user-1', email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace' };
    // A session, as far as the client can tell: its readable CSRF cookie.
    document.cookie = 'zx_csrf=csrf-1; path=/';
    vi.stubGlobal(
      'fetch',
      vi.fn(fetchFrom([http.get('*/v1/user', () => HttpResponse.json({ user })), ...genealogyHandlers(store)])),
    );
    const view = render(
      <TestWrapper>
        <PeopleList />
      </TestWrapper>,
    );
    // The table re-renders once your own record is known, so look the rows up after that.
    const line = await view.findByText('Not connected yet');
    expect(view.getByRole('link', { name: /Ralph King-Milbanke/ })).toContainElement(line);
    expect(within(view.getByRole('link', { name: /Ada Lovelace/ })).queryByText('Not connected yet')).toBeNull();
  });
});
