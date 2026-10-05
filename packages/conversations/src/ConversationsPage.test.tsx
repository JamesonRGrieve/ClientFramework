// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADA, conversationsFixture, emptyStore, ME } from './conversations.mocks';
import { ConversationsPage } from './ConversationsPage';
import { renderConversations } from './testing.mocks';

describe('ConversationsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the conversations, most recent first, a direct one titled by the other person', async () => {
    const view = renderConversations(<ConversationsPage />);
    const list = await view.findByRole('list', { name: 'Conversations' });
    await vi.waitFor(() => {
      expect(
        within(list)
          .getAllByRole('link')
          .map((link) => [link.textContent, link.getAttribute('href')]),
      ).toEqual([
        ['Babbage', '/conversations/dm-charles'],
        ['Engine plans', '/conversations/plans'],
      ]);
    });
    expect(list).toHaveTextContent('Engine plans · group chat');
  });

  it('starts a group chat and opens it', async () => {
    const store = conversationsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderConversations(<ConversationsPage />, store);
    await user.type(view.getByLabelText('Group chat name'), 'Lab');
    await user.click(view.getByRole('button', { name: 'Start a group chat' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/conversations/conversation-1');
    });
    expect(store.conversations.at(-1)).toMatchObject({
      name: 'Lab',
      description: null,
      is_group_chat: true,
      user_id: ME.id,
    });
  });

  it('messages a teammate, opening their direct conversation', async () => {
    const store = conversationsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderConversations(<ConversationsPage />, store);
    const picker = view.getByLabelText('Message');
    await vi.waitFor(() => {
      expect(within(picker).getByRole('option', { name: 'Ada Lovelace' })).toBeInTheDocument();
    });
    await user.selectOptions(picker, 'Ada Lovelace');
    await user.type(view.getByLabelText('First message (optional)'), 'Hello');
    await user.click(view.getByRole('button', { name: 'Open conversation' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/conversations/conversation-1');
    });
    expect(store.messages.at(-1)).toMatchObject({ conversation_id: 'conversation-1', content: 'Hello' });
    expect(
      store.participants.filter(({ conversation_id: id }) => id === 'conversation-1').map(({ user_id: id }) => id),
    ).toEqual([ME.id, ADA.id]);
  });

  it('asks who to message before opening a conversation', async () => {
    const user = userEvent.setup();
    const view = renderConversations(<ConversationsPage />);
    await user.click(view.getByRole('button', { name: 'Open conversation' }));
    expect(await view.findByRole('alert')).toHaveTextContent('Choose who to message.');
  });

  it('says so when there are no conversations', async () => {
    const view = renderConversations(<ConversationsPage />, emptyStore());
    expect(await view.findByText('You have no conversations yet.')).toBeInTheDocument();
  });
});
