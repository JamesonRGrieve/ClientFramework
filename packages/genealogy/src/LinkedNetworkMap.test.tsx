// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { TestWrapper } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LinkedNetwork } from './genealogyApi';
import { genealogyHandlers, threePolyculesFixture } from './genealogy.mocks';
import { byGroup, LinkedNetworkMap } from './LinkedNetworkMap';
import { renderGenealogy } from './testing.mocks';

const polycule = (index: number): string => `Polycule ${String(index + 1)}`;

describe('LinkedNetworkMap', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists each polycule branching off the centre, nearest first', async () => {
    const view = renderGenealogy(<LinkedNetworkMap title='Your polycules' groupLabel={polycule} />, threePolyculesFixture());
    const first = await view.findByRole('region', { name: 'Polycule 1' });
    expect(
      within(first)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Alex', 'Priya', 'Riley']);
    expect(view.getByRole('region', { name: 'Polycule 2' })).toHaveTextContent('Casey');
    expect(view.getByRole('region', { name: 'Polycule 3' })).toHaveTextContent('Jordan');
    expect(view.container.querySelectorAll('.genealogy-node')).toHaveLength(9);
  });

  it('starts a new user off by adding them, linked to their account', async () => {
    const store = { persons: [], relationships: [] };
    const user = { id: 'user-1', email: 'sam@example.com', first_name: 'Sam', last_name: 'Rivera' };
    // A session, as far as the client can tell: its readable CSRF cookie.
    document.cookie = 'zx_csrf=csrf-1; path=/';
    vi.stubGlobal(
      'fetch',
      vi.fn(fetchFrom([http.get('*/v1/user', () => HttpResponse.json({ user })), ...genealogyHandlers(store)])),
    );
    const view = render(
      <TestWrapper>
        <LinkedNetworkMap />
      </TestWrapper>,
    );
    await userEvent.setup().click(await view.findByRole('button', { name: 'Add me' }));
    expect(await view.findByText('Nobody is connected to you yet.')).toBeInTheDocument();
    expect(store.persons).toMatchObject([{ name: 'Sam Rivera', linked_user_id: 'user-1' }]);
    expect(view.queryByRole('alert')).toBeNull();
    document.cookie = 'zx_csrf=; path=/; max-age=0';
  });
});

describe('byGroup', () => {
  it('groups members, nearest first, leaving the centre out', () => {
    const node = (key: string, distance: number, group: number | null) => ({
      key,
      name: key,
      visibility: 'named',
      mine: true,
      person_id: key,
      user_id: null,
      distance,
      group,
    });
    const linked: LinkedNetwork = {
      center: 'me',
      kinds: ['partnership'],
      nodes: [node('me', 0, null), node('far', 2, 0), node('near', 1, 0), node('other', 1, 1)],
      ties: [],
    };
    expect(byGroup(linked).map((members) => members.map((member) => member.key))).toEqual([['near', 'far'], ['other']]);
  });
});
