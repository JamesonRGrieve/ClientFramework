// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chainsFixture } from './chains.mocks';
import { ChainsPage } from './ChainsPage';
import { renderChains } from './testing.mocks';

const MAKE = 'Make chain';

describe('ChainsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the chains favourites first, each linking to its page', async () => {
    const view = renderChains(<ChainsPage />);
    const list = await view.findByRole('list', { name: 'Chains' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['★ Favourite: Daily digest', 'Blank']);
    expect(within(list).getByRole('link', { name: 'Blank' })).toHaveAttribute('href', '/chains/empty');
  });

  it('makes a chain and opens it', async () => {
    const store = chainsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderChains(<ChainsPage />, store);
    await user.type(view.getByLabelText('Name'), ' Weekly ');
    await user.type(view.getByLabelText('Description (optional)'), 'Every Monday');
    await user.click(view.getByRole('button', { name: MAKE }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/chains/chain-1');
    });
    expect(store.chains.at(-1)).toMatchObject({ name: 'Weekly', description: 'Every Monday' });
  });

  it('asks for a name, and says when there are no chains', async () => {
    const user = userEvent.setup();
    const view = renderChains(<ChainsPage />, { ...chainsFixture(), chains: [] });
    expect(await view.findByText('You have no chains yet.')).toBeInTheDocument();
    await user.click(view.getByRole('button', { name: MAKE }));
    expect(await view.findByRole('alert')).toHaveTextContent('Give the chain a name.');
  });
});
