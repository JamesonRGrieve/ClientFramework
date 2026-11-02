// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALEX, emptyMediaStore, mediaFixture, ME, SAM } from './media.mocks';
import { present, renderMedia } from './testing.mocks';
import { WatchListPage } from './WatchListPage';

const PEOPLE = [
  { userId: ALEX, name: 'Alex' },
  { userId: SAM, name: 'Sam' },
];
const ON_LIST = { name: 'On the list' };
const TONIGHT = { name: 'Tonight' };

describe('WatchListPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('picks what everyone wants, and names who wants what', async () => {
    const view = renderMedia(<WatchListPage people={PEOPLE} />);
    const tonight = await view.findByRole('region', TONIGHT);
    expect(await within(tonight).findByText('The Matrix (1999)')).toBeInTheDocument();
    expect(tonight).toHaveTextContent('Everyone on the list wants to see it.');
    const titles = view.getByRole('list', ON_LIST);
    expect(titles).toHaveTextContent('Wanted by You, Alex');
    expect(titles).toHaveTextContent('Wanted by Alex');
    expect(view.getByText(/not endorsed or certified by TMDB/)).toBeInTheDocument();
  });

  it('finds a film and adds it, wanted by you', async () => {
    const store = mediaFixture();
    const user = userEvent.setup();
    const view = renderMedia(<WatchListPage people={PEOPLE} />, store);
    await user.type(await view.findByLabelText('Find a film'), 'fellowship');
    await user.click(view.getByRole('button', { name: 'Search' }));
    await user.click(await view.findByRole('button', { name: 'Add The Fellowship of the Ring (2001)' }));
    expect(
      await within(view.getByRole('list', ON_LIST)).findByText('The Fellowship of the Ring (2001)'),
    ).toBeInTheDocument();
    expect(store.lists[0]?.titles.at(-1)).toMatchObject({ title: 'The Fellowship of the Ring', wanted_by: [ME] });
    expect(within(view.getByRole('list', { name: 'Search results' })).getAllByText('On the list')).toHaveLength(1);
  });

  it('says you want to see something, and marks it watched', async () => {
    const store = mediaFixture();
    const user = userEvent.setup();
    const view = renderMedia(<WatchListPage people={PEOPLE} />, store);
    const titles = await view.findByRole('list', ON_LIST);
    const gump = present(within(titles).getAllByRole('listitem')[1], 'a second title');
    await user.click(within(gump).getByRole('checkbox', { name: 'I want to see it' }));
    await vi.waitFor(() => {
      expect(store.lists[0]?.titles[1]?.wanted_by).toEqual([ALEX, ME]);
    });
    await user.click(view.getByRole('button', { name: 'Watched The Matrix (1999)' }));
    await vi.waitFor(() => {
      expect(store.lists[0]?.titles[0]?.watched_on).toBe('2026-11-02');
    });
    expect(await within(await view.findByRole('region', TONIGHT)).findByText('Forrest Gump (1994)')).toBeInTheDocument();
  });

  it('shares the list you keep, and takes someone off', async () => {
    const store = mediaFixture();
    const user = userEvent.setup();
    const view = renderMedia(<WatchListPage people={PEOPLE} />, store);
    await user.selectOptions(await view.findByLabelText('Share with'), 'Sam');
    await user.click(view.getByRole('button', { name: 'Share' }));
    await vi.waitFor(() => {
      expect(store.lists[0]?.member_ids).toEqual([ALEX, SAM]);
    });
    await user.click(await view.findByRole('button', { name: 'Take Alex off the list' }));
    await vi.waitFor(() => {
      expect(store.lists[0]?.member_ids).toEqual([SAM]);
    });
  });

  it('lets a member leave a list someone else keeps, but not share it', async () => {
    const store = { ...mediaFixture(), me: ALEX };
    const user = userEvent.setup();
    const view = renderMedia(<WatchListPage people={[{ userId: ME, name: 'Jo' }]} />, store);
    expect(await view.findByText('Jo (keeps the list)')).toBeInTheDocument();
    expect(view.queryByLabelText('Share with')).toBeNull();
    await user.click(view.getByRole('button', { name: 'Leave this list' }));
    await vi.waitFor(() => {
      expect(store.lists[0]?.member_ids).toEqual([]);
    });
  });

  it('starts a first list', async () => {
    const store = emptyMediaStore();
    const user = userEvent.setup();
    const view = renderMedia(<WatchListPage />, store);
    const name = await view.findByLabelText('Name your first list');
    await user.clear(name);
    await user.type(name, 'Docs');
    await user.click(view.getByRole('button', { name: 'Start the list' }));
    expect(await view.findByText('Docs')).toBeInTheDocument();
    expect(store.lists.map((list) => list.name)).toEqual(['Docs']);
  });

  it('wraps starting a list, for an app that holds it to a plan', async () => {
    const view = renderMedia(<WatchListPage wrapStart={() => <p>Upgrade to keep a list</p>} />, emptyMediaStore());
    expect(await view.findByText('Upgrade to keep a list')).toBeInTheDocument();
    expect(view.queryByLabelText('Name your first list')).toBeNull();
  });
});
