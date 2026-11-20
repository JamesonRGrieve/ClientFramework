// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UNDO_MS } from 'zephyrex/hooks/useToast';
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

  it('starts on the first person the app knows, even when they arrive late', async () => {
    const user = userEvent.setup();
    const view = renderGifts(<GiftsPage people={[]} />, emptyGiftsStore());
    await user.click(view.getByRole('button', { name: 'Add gift' }));
    const forGroup = (): HTMLElement => view.getByRole('group', { name: 'For' });
    // Nobody known yet: the gift is for someone typed.
    expect(within(forGroup()).getByRole('button', { name: /Someone else/, pressed: true })).toBeInTheDocument();
    view.rerender(
      <TestWrapper>
        <GiftsPage people={PEOPLE} />
      </TestWrapper>,
    );
    expect(within(forGroup()).getByRole('button', { name: /Alex/, pressed: true })).toBeInTheDocument();
    expect(view.queryByLabelText('Their name')).toBeNull();
  });

  it('adds a gift for someone the app knows, or someone typed', async () => {
    const store = emptyGiftsStore();
    const user = userEvent.setup();
    const view = renderGifts(<GiftsPage people={PEOPLE} />, store);
    await user.click(view.getByRole('button', { name: 'Add gift' }));
    await user.click(within(view.getByRole('group', { name: 'For' })).getByRole('button', { name: /Sam/ }));
    await user.type(view.getByLabelText('Gift'), 'Concert tickets');
    await user.click(view.getByRole('button', { name: 'Add the gift' }));
    await vi.waitFor(() => {
      expect(store.gifts).toMatchObject([{ for_name: 'Sam', for_ref: 'p-sam', title: 'Concert tickets' }]);
    });
    await user.click(await view.findByRole('button', { name: 'Add gift' }));
    await user.click(within(view.getByRole('group', { name: 'For' })).getByRole('button', { name: /Someone else/ }));
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
    await user.click(
      within(await view.findByRole('radiogroup', { name: 'Where A silk scarf is' })).getByRole('radio', { name: 'Bought' }),
    );
    await vi.waitFor(() => {
      expect(store.gifts[0]?.status).toBe('bought');
    });
    // Deleting hides the gift at once and keeps it for the undo window; then it is gone.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await user.click(view.getByRole('button', { name: 'Delete Peonies' }));
    expect(view.queryByRole('button', { name: 'Delete Peonies' })).toBeNull();
    expect(store.gifts.map((gift) => gift.title)).toContain('Peonies');
    vi.advanceTimersByTime(UNDO_MS);
    vi.useRealTimers();
    await vi.waitFor(() => {
      expect(store.gifts.map((gift) => gift.title)).toEqual(['A silk scarf']);
    });
  });

  it('renames a gift where it stands', async () => {
    const store = giftsFixture();
    const user = userEvent.setup();
    const view = renderGifts(<GiftsPage people={PEOPLE} />, store);
    await user.click(await view.findByRole('button', { name: 'Gift: Peonies. Edit' }));
    const field = view.getByRole('textbox', { name: 'Gift' });
    await user.clear(field);
    await user.type(field, 'Tulips{Enter}');
    await vi.waitFor(() => {
      expect(store.gifts.map((gift) => gift.title)).toContain('Tulips');
    });
  });

  it('marks every chosen gift given at once', async () => {
    const store = giftsFixture();
    const user = userEvent.setup();
    const view = renderGifts(<GiftsPage people={PEOPLE} />, store);
    await user.click(await view.findByRole('checkbox', { name: 'Choose A silk scarf' }));
    await user.click(view.getByRole('checkbox', { name: 'Choose Peonies' }));
    expect(view.getByRole('status')).toHaveTextContent('2 gifts chosen');
    await user.click(view.getByRole('button', { name: 'Mark given' }));
    await vi.waitFor(() => {
      expect(store.gifts.map((gift) => gift.status)).toEqual(['given', 'given']);
    });
  });

  it('moves chosen gifts to someone else', async () => {
    const store = giftsFixture();
    const user = userEvent.setup();
    const view = renderGifts(<GiftsPage people={PEOPLE} />, store);
    await user.click(await view.findByRole('checkbox', { name: 'Choose A silk scarf' }));
    await user.selectOptions(view.getByRole('combobox', { name: 'Move to' }), 'p-sam');
    await vi.waitFor(() => {
      expect(store.gifts.at(0)?.for_ref).toBe('p-sam');
    });
  });

  it('moves through the list with J and K, and deletes with Delete', async () => {
    const store = giftsFixture();
    const user = userEvent.setup();
    const view = renderGifts(<GiftsPage people={PEOPLE} />, store);
    const first = await view.findByRole('button', { name: /^Gift: A silk scarf/ });
    first.focus();
    await user.keyboard('j');
    expect(view.getByRole('button', { name: /^Gift: Peonies/ })).toHaveFocus();
    await user.keyboard('{Delete}');
    expect(view.queryByRole('button', { name: /^Gift: Peonies/ })).toBeNull();
  });

  it('saves an idea from the app, and searches the shop for it', async () => {
    const store = emptyGiftsStore();
    const user = userEvent.setup();
    const view = renderGifts(<GiftsPage people={PEOPLE} ideas={IDEAS} />, store);
    const ideas = view.getByRole('list', { name: 'Ideas' });
    expect(ideas).toHaveTextContent('For Alex · Their favourite flower');
    await user.click(within(ideas).getByRole('button', { name: 'Save to list: Peonies' }));
    await vi.waitFor(() => {
      expect(store.gifts).toMatchObject([{ for_ref: 'p-alex', title: 'Peonies', note: 'Their favourite flower' }]);
    });
    expect(within(ideas).getByText('Saved to your list')).toBeInTheDocument();
    await user.click(within(ideas).getByRole('button', { name: 'Find it at the shop: Peonies' }));
    expect(await within(ideas).findByRole('link', { name: 'Search the shop for Peonies' })).toHaveAttribute(
      'href',
      `https://www.amazon.ca/s?k=Peonies&tag=${TAG}`,
    );
  });

  it('says the shop links earn a commission', () => {
    const view = renderGifts(<GiftsPage />, emptyGiftsStore());
    expect(view.getByText(/As an Amazon Associate/)).toBeInTheDocument();
  });

  it('holds the Ideas column open while the app is still working them out', () => {
    const store = giftsFixture();
    const view = renderGifts(<GiftsPage people={PEOPLE} ideasLoading />, store);
    expect(view.getByText('Loading ideas').closest('[role=status]')).toBeInTheDocument();
    expect(view.getByText('Ideas')).toBeInTheDocument();
  });

  it('shows no Ideas column once the app has none', () => {
    const store = giftsFixture();
    const view = renderGifts(<GiftsPage people={PEOPLE} />, store);
    expect(view.queryByText('Ideas')).not.toBeInTheDocument();
    expect(view.queryByText('Loading ideas')).not.toBeInTheDocument();
  });
});
