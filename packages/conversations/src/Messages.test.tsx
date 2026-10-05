// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { conversationsFixture, ME } from './conversations.mocks';
import { Messages, quoted } from './Messages';
import { renderConversations } from './testing.mocks';

const MESSAGES = 'Messages';
/** The message from someone outside the user's teams. */
const STRANGERS = 'Count me in.';

/** The message item whose text is `content`. */
const itemWith = async (view: ReturnType<typeof renderConversations>, content: string): Promise<HTMLElement> => {
  const list = await view.findByRole('list', { name: MESSAGES });
  const item = within(list).getByText(content).closest('li');
  if (item === null) {
    throw new Error(`No message "${content}"`);
  }
  return item;
};

describe('quoted', () => {
  it('quotes a short message whole and the start of a long one', () => {
    expect(quoted('Short.')).toBe('Short.');
    expect(quoted(`${'a'.repeat(79)} more words`)).toBe(`${'a'.repeat(79)}…`);
  });
});

describe('Messages', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the messages oldest first with their authors, replies and the agent', async () => {
    const view = renderConversations(<Messages conversationId='plans' viewerId={ME.id} ownerView />);
    const list = await view.findByRole('list', { name: MESSAGES });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.querySelector('.font-medium')?.textContent)).toEqual([
      'Ada Lovelace',
      'Grace',
      'Agent',
      'Someone outside your teams',
    ]);
    expect(within(items[1] ?? list).getByText('Replying to Ada Lovelace: The cards are punched.')).toBeInTheDocument();
  });

  it('offers editing only on the viewer’s own messages, and deleting on any to the owner', async () => {
    const view = renderConversations(<Messages conversationId='plans' viewerId={ME.id} ownerView />);
    const ada = await itemWith(view, 'The cards are punched.');
    expect(within(ada).queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(within(ada).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    const mine = await itemWith(view, 'Then we run it.');
    expect(within(mine).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('offers a participant who isn’t the owner no delete on others’ messages', async () => {
    const view = renderConversations(<Messages conversationId='dm-charles' viewerId={ME.id} ownerView={false} />);
    const theirs = await itemWith(view, 'Lunch?');
    expect(within(theirs).queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('sends a message, and a reply to the one chosen', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(<Messages conversationId='plans' viewerId={ME.id} ownerView />, store);
    await user.type(await view.findByLabelText('Message'), 'Tomorrow at nine.');
    await user.click(view.getByRole('button', { name: 'Send' }));
    expect(await view.findByText('Tomorrow at nine.')).toBeInTheDocument();
    await user.click(within(await itemWith(view, STRANGERS)).getByRole('button', { name: 'Reply' }));
    await user.type(view.getByLabelText('Reply'), 'Welcome.');
    await user.click(view.getByRole('button', { name: 'Send' }));
    await vi.waitFor(() => {
      expect(store.messages.at(-1)).toMatchObject({ content: 'Welcome.', parent_id: 'm4', user_id: ME.id });
    });
    expect(view.getByLabelText('Message')).toHaveValue('');
  });

  it('edits the viewer’s message, and keeps their text beside the message as it is now when it changed first', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(<Messages conversationId='plans' viewerId={ME.id} ownerView />, store);
    await user.click(within(await itemWith(view, 'Then we run it.')).getByRole('button', { name: 'Edit' }));
    store.messages = store.messages.map((row) =>
      row.id === 'm2' ? { ...row, content: 'Then we run it, twice.', updated_at: '2026-10-02T08:00:00.000001' } : row,
    );
    const editor = view.getByLabelText('Edit message');
    await user.clear(editor);
    await user.type(editor, 'Then we run it at nine.');
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(await view.findByRole('radio', { name: 'Current: Then we run it, twice.' })).not.toBeChecked();
    expect(store.messages.find(({ id }) => id === 'm2')?.content).toBe('Then we run it, twice.');
  });

  it('deletes a message', async () => {
    const store = conversationsFixture();
    const user = userEvent.setup();
    const view = renderConversations(<Messages conversationId='plans' viewerId={ME.id} ownerView />, store);
    await user.click(within(await itemWith(view, STRANGERS)).getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(view.queryByText(STRANGERS)).toBeNull();
    });
    expect(store.messages.some(({ id }) => id === 'm4')).toBe(false);
  });

  it('says so when there are no messages', async () => {
    const store = conversationsFixture();
    store.messages = [];
    const view = renderConversations(<Messages conversationId='plans' viewerId={ME.id} ownerView />, store);
    expect(await view.findByText('No messages yet.')).toBeInTheDocument();
  });
});
