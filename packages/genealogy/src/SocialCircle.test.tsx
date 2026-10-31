// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { personOf, polyculeFixture } from './genealogy.mocks';
import { FAMILY_TREE } from './options';
import { GenealogyOptionsProvider } from './OptionsProvider';
import { byDistance, distanceTitle, SocialCircle } from './SocialCircle';
import { renderGenealogy } from './testing.mocks';

const DIRECT = 'Direct ties';

describe('SocialCircle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the polycule tie by tie and the metamours with the partners they share', async () => {
    const store = polyculeFixture();
    const view = renderGenealogy(<SocialCircle person={personOf(store, 'ana')} people={store.persons} />, store);
    const direct = await view.findByRole('region', { name: DIRECT });
    expect(within(direct).getByRole('link', { name: 'Ben' })).toHaveAttribute('href', '/genealogy/ben');
    expect(view.getByRole('region', { name: 'Ties of ties' })).toHaveTextContent('Cleo');
    expect(view.getByRole('region', { name: '3 ties away' })).toHaveTextContent('Dev');
    const metamours = await view.findByRole('region', { name: 'Metamours' });
    expect(metamours).toHaveTextContent('Cleo');
    expect(metamours).toHaveTextContent('through Ben');
  });

  it('reaches friends of the polycule, and ended partners, only when asked', async () => {
    const store = polyculeFixture();
    const user = userEvent.setup();
    const view = renderGenealogy(<SocialCircle person={personOf(store, 'ana')} people={store.persons} />, store);
    await view.findByRole('region', { name: DIRECT });
    expect(view.queryByRole('link', { name: 'Fay' })).toBeNull();
    expect(view.queryByRole('link', { name: 'Eli' })).toBeNull();
    await user.click(view.getByRole('checkbox', { name: 'Through friendships too' }));
    expect(await view.findByRole('link', { name: 'Fay' })).toBeInTheDocument();
    await user.click(view.getByRole('checkbox', { name: 'Include ended relationships' }));
    expect(await view.findByRole('link', { name: 'Eli' })).toBeInTheDocument();
  });

  it("walks the kinds of tie the app's options name", async () => {
    const store = polyculeFixture();
    const view = renderGenealogy(
      <GenealogyOptionsProvider options={{ ...FAMILY_TREE, circleKinds: ['partnership', 'friendship'] }}>
        <SocialCircle person={personOf(store, 'ana')} people={store.persons} />
      </GenealogyOptionsProvider>,
      store,
    );
    expect(await view.findByRole('link', { name: 'Fay' })).toBeInTheDocument();
  });

  it('says so when someone has no partners', async () => {
    const store = polyculeFixture();
    const view = renderGenealogy(<SocialCircle person={personOf(store, 'eli')} people={store.persons} />, store);
    expect(await view.findByText('No partners are recorded for Eli.')).toBeInTheDocument();
    expect(view.queryByRole('region', { name: 'Metamours' })).toBeNull();
  });
});

describe('byDistance', () => {
  it('groups members nearest first, keeping their order within a group', () => {
    expect(
      byDistance([
        { person_id: 'cleo', distance: 2 },
        { person_id: 'ben', distance: 1 },
        { person_id: 'fay', distance: 2 },
      ]),
    ).toEqual([
      { distance: 1, personIds: ['ben'] },
      { distance: 2, personIds: ['cleo', 'fay'] },
    ]);
  });
});

describe('distanceTitle', () => {
  it.each([
    [1, DIRECT],
    [2, 'Ties of ties'],
    [4, '4 ties away'],
  ])('titles distance %i as %s', (distance, title) => {
    expect(distanceTitle(distance)).toBe(title);
  });
});
