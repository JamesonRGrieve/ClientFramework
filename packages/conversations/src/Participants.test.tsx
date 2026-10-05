// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { ADA, CHARLES, conversationsFixture, ME } from './conversations.mocks';
import { Participants } from './Participants';
import { renderConversations } from './testing.mocks';

const PEOPLE = 'Participants';

describe('Participants', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists who is in the chat, the viewer and the owner marked, and lets the owner remove others', async () => {
    const store = conversationsFixture();
    const view = renderConversations(
      <Participants conversation={rowOf(store.conversations, 'plans')} viewerId={ME.id} />,
      store,
    );
    const list = await view.findByRole('list', { name: PEOPLE });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Grace (you) · owner', 'Ada LovelaceRemove', 'Someone outside your teamsRemove']);
  });

  it('removes someone, guarded by their seat', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(
      <Participants conversation={rowOf(store.conversations, 'plans')} viewerId={ME.id} />,
      store,
    );
    const list = await view.findByRole('list', { name: PEOPLE });
    const ada = within(list).getByText('Ada Lovelace').closest('li');
    await user.click(within(ada ?? list).getByRole('button', { name: 'Remove' }));
    await vi.waitFor(() => {
      expect(within(list).queryByText('Ada Lovelace')).toBeNull();
    });
    expect(store.participants.some(({ conversation_id: id, user_id: who }) => id === 'plans' && who === ADA.id)).toBe(false);
  });

  it('lets a participant who isn’t the owner leave, back to their conversations', async () => {
    const store = conversationsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderConversations(
      <Participants conversation={rowOf(store.conversations, 'dm-charles')} viewerId={ME.id} />,
      store,
    );
    const list = await view.findByRole('list', { name: PEOPLE });
    expect(
      within(list)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Leave']);
    await user.click(within(list).getByRole('button', { name: 'Leave' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/conversations');
    });
    // A direct conversation takes no one else.
    expect(view.queryByRole('form', { name: 'Add someone to the chat' })).toBeNull();
  });

  it('adds a teammate who isn’t in the chat yet', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(
      <Participants conversation={rowOf(store.conversations, 'plans')} viewerId={ME.id} />,
      store,
    );
    const picker = await view.findByLabelText('Add someone');
    await vi.waitFor(() => {
      expect([...picker.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
        'Choose someone…',
        'Babbage',
      ]);
    });
    await user.selectOptions(picker, 'Babbage');
    await user.click(view.getByRole('button', { name: 'Add' }));
    expect(await view.findByText('Babbage')).toBeInTheDocument();
    expect(store.participants.at(-1)).toMatchObject({ conversation_id: 'plans', user_id: CHARLES.id });
  });

  it('asks who to add before adding', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(
      <Participants conversation={rowOf(store.conversations, 'plans')} viewerId={ME.id} />,
      store,
    );
    await user.click(await view.findByRole('button', { name: 'Add' }));
    expect(await view.findByRole('alert')).toHaveTextContent('Choose who to add.');
  });
});
