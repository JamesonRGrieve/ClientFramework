// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { emptyGiftsStore, giftsFixture, TAG } from './gifts.mocks';
import { GiftsPage } from './GiftsPage';
import { renderGifts } from './testing.mocks';

const PEOPLE = [
  { ref: 'p-alex', name: 'Alex' },
  { ref: 'p-sam', name: 'Sam' },
];
const IDEAS = [{ forRef: 'p-alex', forName: 'Alex', title: 'Peonies', note: 'Their favourite flower' }];

describe('GiftsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists gifts by who they are for, with where each one is', async () => {
    const view = renderGifts(<GiftsPage people={PEOPLE} />);
    const alex = await view.findByRole('region', { name: 'For Alex' });
    expect(alex).toHaveTextContent('A silk scarf');
    expect(alex).toHaveTextContent('Emerald');
    expect(
      within(view.getByRole('region', { name: 'For Sam' })).getByRole('link', { name: 'Where to buy it' }),
    ).toHaveAttribute('href', `https://www.amazon.ca/dp/B01?tag=${TAG}`);
  });

  it('starts on the first person the app knows, even when they arrive late', () => {
    const view = renderGifts(<GiftsPage people={[]} />, emptyGiftsStore());
    expect(view.getByLabelText('For')).toHaveValue('');
    view.rerender(
      <TestWrapper>
        <GiftsPage people={PEOPLE} />
      </TestWrapper>,
    );
    expect(view.getByLabelText('For')).toHaveValue('p-alex');
    expect(view.queryByLabelText('Their name')).toBeNull();
  });

  it('adds a gift for someone the app knows, or someone typed', async () => {
    const store = emptyGiftsStore();
    const user = userEvent.setup();
    const view = renderGifts(<GiftsPage people={PEOPLE} />, store);
    await user.selectOptions(view.getByLabelText('For'), 'Sam');
    await user.type(view.getByLabelText('Gift'), 'Concert tickets');
    await user.click(view.getByRole('button', { name: 'Add the gift' }));
    await vi.waitFor(() => {
      expect(store.gifts).toMatchObject([{ for_name: 'Sam', for_ref: 'p-sam', title: 'Concert tickets' }]);
    });
    await user.selectOptions(view.getByLabelText('For'), 'Someone else…');
    await user.type(view.getByLabelText('Their name'), 'Jordan');
    await user.type(view.getByLabelText('Gift'), 'A book');
    await user.click(view.getByRole('button', { name: 'Add the gift' }));
    await vi.waitFor(() => {
      expect(store.gifts.at(-1)).toMatchObject({ for_name: 'Jordan', for_ref: null, title: 'A book' });
    });
  });

  it('moves a gift along, and deletes one', async () => {
    const store = giftsFixture();
    const user = userEvent.setup();
    const view = renderGifts(<GiftsPage people={PEOPLE} />, store);
    await user.selectOptions(await view.findByLabelText('Where A silk scarf is'), 'Bought');
    await vi.waitFor(() => {
      expect(store.gifts[0]?.status).toBe('bought');
    });
    await user.click(view.getByRole('button', { name: 'Delete Peonies' }));
    await vi.waitFor(() => {
      expect(store.gifts.map((gift) => gift.title)).toEqual(['A silk scarf']);
    });
  });

  it('saves an idea from the app, and searches the shop for it', async () => {
    const store = emptyGiftsStore();
    const user = userEvent.setup();
    const view = renderGifts(<GiftsPage people={PEOPLE} ideas={IDEAS} />, store);
    const ideas = view.getByRole('list', { name: 'Ideas' });
    expect(ideas).toHaveTextContent('For Alex · Their favourite flower');
    await user.click(within(ideas).getByRole('button', { name: 'Save Peonies' }));
    await vi.waitFor(() => {
      expect(store.gifts).toMatchObject([{ for_ref: 'p-alex', title: 'Peonies', note: 'Their favourite flower' }]);
    });
    expect(within(ideas).getByText('Saved')).toBeInTheDocument();
    await user.click(within(ideas).getByRole('button', { name: 'Find Peonies at the shop' }));
    expect(await within(ideas).findByRole('link', { name: 'Search the shop for Peonies' })).toHaveAttribute(
      'href',
      `https://www.amazon.ca/s?k=Peonies&tag=${TAG}`,
    );
  });

  it('says the shop links earn a commission', () => {
    const view = renderGifts(<GiftsPage />, emptyGiftsStore());
    expect(view.getByText(/As an Amazon Associate/)).toBeInTheDocument();
  });
});
